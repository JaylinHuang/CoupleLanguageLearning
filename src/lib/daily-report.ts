import { prisma } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email";
import { deepseekText } from "@/lib/deepseek-json";
import { shanghaiDayRange, formatShanghai } from "@/lib/timezone";
import type { QuizAnswerDetail } from "@/lib/types";

// 汇总 Erika「上海时区当天」的学习进度，晚上 23:00 发给 Lin
export async function generateAndSendDailyReport(): Promise<{
  sent: boolean;
  text: string;
  skipped?: boolean;
}> {
  const { day, start, end } = shanghaiDayRange();

  const erika = await prisma.user.findUnique({
    where: { username: "erika" },
    include: { progress: true },
  });
  if (!erika) return { sent: false, text: "Erika account not found" };

  const attempts = await prisma.lessonAttempt.findMany({
    where: {
      userId: erika.id,
      completedAt: { gte: start, lte: end },
    },
    include: { lesson: { select: { title: true } } },
    orderBy: { completedAt: "asc" },
  });

  const wrongAnswers: Array<{
    lesson: string;
    prompt: string;
    userAnswer: string;
    correctAnswer: string;
  }> = [];
  for (const a of attempts) {
    try {
      const answers = JSON.parse(a.answers) as QuizAnswerDetail[];
      for (const ans of answers) {
        if (!ans.isCorrect) {
          wrongAnswers.push({
            lesson: a.lesson.title,
            prompt: ans.prompt,
            userAnswer: ans.userAnswer,
            correctAnswer: ans.correctAnswer,
          });
        }
      }
    } catch {
      // 忽略坏数据
    }
  }

  const reviewedCount = await prisma.reviewCard.count({
    where: {
      userId: erika.id,
      lastReview: { gte: start, lte: end },
    },
  });

  const grammarCount = await prisma.grammarCorrection.count({
    where: {
      userId: erika.id,
      createdAt: { gte: start, lte: end },
    },
  });

  const homeworkSubs = await prisma.homeworkSubmission.findMany({
    where: {
      userId: erika.id,
      submittedAt: { gte: start, lte: end },
    },
    include: { homework: { select: { title: true } } },
  });

  const wishes = await prisma.wishItem.findMany({
    where: {
      userId: erika.id,
      createdAt: { gte: start, lte: end },
    },
  });

  const hasActivity =
    attempts.length > 0 ||
    reviewedCount > 0 ||
    grammarCount > 0 ||
    homeworkSubs.length > 0 ||
    wishes.length > 0;

  // 当天完全没学习就不发邮件，避免空日报打扰
  if (!hasActivity) {
    return {
      sent: false,
      skipped: true,
      text: `今天（${day}）Erika 没有学习记录，跳过日报。`,
    };
  }

  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
      : null;

  const lines: string[] = [
    `Erika 学习日报（${day}）`,
    ``,
    `【今日概况】`,
    `- 完成课程：${attempts.length} 次${avgScore != null ? `（平均 ${avgScore}%）` : ""}`,
    `- 复习卡片：${reviewedCount} 张`,
    `- 写作纠错：${grammarCount} 次`,
    `- 提交作业：${homeworkSubs.length} 份`,
    `- 学习愿望：${wishes.length} 条`,
    `- 当前连胜：${erika.progress?.streak ?? 0} 天 · Lv.${erika.progress?.level ?? 1}（${erika.progress?.xp ?? 0} XP）`,
  ];

  if (attempts.length > 0) {
    lines.push(``, `【完成的课程】`);
    for (const a of attempts) {
      lines.push(
        `- ${a.lesson.title}：${a.score}%（${formatShanghai(a.completedAt)}）`,
      );
    }
  }

  if (wrongAnswers.length > 0) {
    lines.push(``, `【今日错题（共 ${wrongAnswers.length} 道）】`);
    for (const w of wrongAnswers.slice(0, 12)) {
      lines.push(
        `- [${w.lesson}] ${w.prompt}`,
        `  她答：${w.userAnswer || "（未作答）"} → 正确：${w.correctAnswer}`,
      );
    }
  }

  if (homeworkSubs.length > 0) {
    lines.push(``, `【今日作业】`);
    for (const s of homeworkSubs) {
      lines.push(`- ${s.homework.title}（${formatShanghai(s.submittedAt)}）`);
    }
  }

  if (wishes.length > 0) {
    lines.push(``, `【今日学习愿望】`);
    for (const w of wishes) {
      lines.push(`- ${w.text}`);
    }
  }

  const aiComment = await deepseekText(
    "你是中文老师助理。根据今天的学习数据，用中文给她男朋友 Lin 写 2-3 句简短点评：先肯定，再点出最该巩固的一点。语气温暖，不要列表。",
    lines.join("\n"),
    200,
  );
  if (aiComment) {
    lines.push(``, `【AI 点评】`, aiComment);
  }

  lines.push(``, `— Jaylin_love_Erika 每日汇总（每天 23:00 发送）`);

  const text = lines.join("\n");
  const sent = await sendNotificationEmail({
    subject: `[Jaylin_love_Erika] Erika 学习日报 ${day}`,
    text,
  });

  return { sent, text };
}
