import { prisma } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email";
import { deepseekText } from "@/lib/deepseek-json";
import { shanghaiDayRange, formatShanghai } from "@/lib/timezone";
import type { QuizAnswerDetail } from "@/lib/types";

// 汇总 Erika 上一整周学习数据；Cron 定在北京时间周一 00:00（周日晚上十二点）发送
export async function generateAndSendWeeklyReport(): Promise<{
  sent: boolean;
  text: string;
}> {
  // 周一 0 点触发时，「今天」已是周一；周报覆盖到昨天（周日）为止的 7 天
  const { start: todayStart } = shanghaiDayRange();
  const end = new Date(todayStart.getTime() - 1);
  const since = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000 + 1);

  const erika = await prisma.user.findUnique({
    where: { username: "erika" },
    include: { progress: true },
  });
  if (!erika) return { sent: false, text: "Erika account not found" };

  const attempts = await prisma.lessonAttempt.findMany({
    where: { userId: erika.id, completedAt: { gte: since } },
    include: { lesson: { select: { title: true } } },
    orderBy: { completedAt: "asc" },
  });

  // 汇总本周错题
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
      // 忽略解析失败的旧数据
    }
  }

  const reviewedCount = await prisma.reviewCard.count({
    where: { userId: erika.id, lastReview: { gte: since } },
  });

  const grammarCount = await prisma.grammarCorrection.count({
    where: { userId: erika.id, createdAt: { gte: since } },
  });

  const hardWords = await prisma.reviewCard.findMany({
    where: { userId: erika.id, markedHard: true },
    include: { word: { select: { simplified: true, english: true } } },
    take: 10,
  });

  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
      : null;

  const lines: string[] = [
    `Erika 学习周报（${since.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })} ~ ${end.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}）`,
    ``,
    `【本周概况】`,
    `- 完成课程次数：${attempts.length}${avgScore != null ? `（平均分 ${avgScore}%）` : ""}`,
    `- 复习卡片：${reviewedCount} 张`,
    `- 写作纠错练习：${grammarCount} 次`,
    `- 当前连胜：${erika.progress?.streak ?? 0} 天 · 等级 Lv.${erika.progress?.level ?? 1}（${erika.progress?.xp ?? 0} XP）`,
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
    lines.push(``, `【本周错题（共 ${wrongAnswers.length} 道）】`);
    for (const w of wrongAnswers.slice(0, 15)) {
      lines.push(
        `- [${w.lesson}] ${w.prompt}`,
        `  她答：${w.userAnswer || "（未作答）"} → 正确：${w.correctAnswer}`,
      );
    }
  }

  if (hardWords.length > 0) {
    lines.push(
      ``,
      `【标记为难的词】`,
      hardWords.map((c) => `${c.word.simplified}(${c.word.english})`).join("、"),
    );
  }

  // AI 中文点评（可选，未配置 DeepSeek 时跳过）
  const aiComment = await deepseekText(
    "你是中文老师助理。根据学习数据用中文写 3-4 句给她男朋友 Lin 看的点评：先肯定进步，指出需要巩固的地方，最后给 1 条下周建议。语气温暖简洁，不要用列表。",
    lines.join("\n"),
    300,
  );
  if (aiComment) {
    lines.push(``, `【AI 点评】`, aiComment);
  }

  lines.push(``, `— Jaylin_love_Erika 自动周报（每周日晚上 24:00 / 周一 0:00 发送）`);

  const text = lines.join("\n");
  const sent = await sendNotificationEmail({
    subject: `[Jaylin_love_Erika] Erika 学习周报`,
    text,
  });

  return { sent, text };
}
