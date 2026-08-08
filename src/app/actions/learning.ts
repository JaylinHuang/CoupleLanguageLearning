"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  awardXp,
  recordStudyDay,
  addWordsToReview,
  markWordsHardDue,
  unlockBadge,
  createNotification,
} from "@/lib/progress";
import { XP_REWARDS } from "@/lib/constants";
import { notifyTutor } from "@/lib/email";
import { resolveTutorUserForLearner } from "@/lib/couple";
import { siteName } from "@/lib/branding";
import { requireLearner, requireAdmin } from "./auth";
import { sm2, type ReviewQuality } from "@/lib/srs";
import type { QuizAnswerDetail, LessonContent } from "@/lib/types";

export async function completeLessonAction(
  lessonId: string,
  score: number,
  answers?: QuizAnswerDetail[],
) {
  const user = await requireLearner();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { words: { include: { word: true } } },
  });
  if (!lesson) throw new Error("Lesson not found");

  // 每次完成都单独存一条答题记录，保留全部历史供 Tutor / Learner 查看错题
  await prisma.lessonAttempt.create({
    data: {
      userId: user.id,
      lessonId,
      score,
      answers: JSON.stringify(answers ?? []),
    },
  });

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: {
      userId: user.id,
      lessonId,
      status: "COMPLETED",
      score,
      completedAt: new Date(),
    },
    update: {
      status: "COMPLETED",
      score,
      completedAt: new Date(),
    },
  });

  await addWordsToReview(
    user.id,
    lesson.words.map((w) => w.wordId),
  );

  // 错题 → 关联本课词汇并立刻进入复习（标 hard）
  if (answers?.some((a) => !a.isCorrect)) {
    const lessonWords = lesson.words.map((lw) => lw.word);
    const hardIds = new Set<string>();
    for (const ans of answers) {
      if (ans.isCorrect) continue;
      const haystacks = [
        ans.audioText ?? "",
        ans.correctAnswer,
        ans.prompt,
      ].map((s) => s.toLowerCase());
      for (const w of lessonWords) {
        const hit =
          haystacks.some(
            (h) =>
              h.includes(w.simplified.toLowerCase()) ||
              h.includes(w.english.toLowerCase()) ||
              w.english.toLowerCase() === ans.correctAnswer.toLowerCase() ||
              w.simplified === ans.correctAnswer,
          );
        if (hit) hardIds.add(w.id);
      }
    }
    // 匹配不到具体词时，把本课全部词标 hard，避免错题丢失
    if (hardIds.size === 0) {
      for (const w of lessonWords) hardIds.add(w.id);
    }
    await markWordsHardDue(user.id, [...hardIds]);
  }

  await awardXp(user.id, XP_REWARDS.lessonComplete);
  await recordStudyDay(user.id);

  const completedCount = await prisma.lessonProgress.count({
    where: { userId: user.id, status: "COMPLETED" },
  });
  if (completedCount === 1) {
    await unlockBadge(user.id, "first_lesson");
  }

  const tutor = await resolveTutorUserForLearner(user.id);
  if (tutor) {
    await createNotification(
      tutor.id,
      "study_complete",
      "Lesson completed",
      `${user.displayName} completed "${lesson.title}" with score ${score}%.`,
    );
  }

  // 不再每次学完就发邮件，改由每天 23:00 日报统一汇总

  revalidatePath("/");
  revalidatePath("/learn");
  revalidatePath("/review");
  revalidatePath("/mistakes");
  revalidatePath("/admin");
  revalidatePath("/admin/progress");
}

export async function reviewWordAction(cardId: string, quality: ReviewQuality) {
  const user = await requireLearner();
  const card = await prisma.reviewCard.findFirst({
    where: { id: cardId, userId: user.id },
  });
  if (!card) throw new Error("Card not found");

  const next = sm2(
    {
      ease: card.ease,
      interval: card.interval,
      repetitions: card.repetitions,
      dueDate: card.dueDate,
    },
    quality,
  );

  await prisma.reviewCard.update({
    where: { id: cardId },
    data: {
      ease: next.ease,
      interval: next.interval,
      repetitions: next.repetitions,
      dueDate: next.dueDate,
      lastReview: new Date(),
      markedHard: quality < 3 ? true : card.markedHard,
    },
  });

  await awardXp(user.id, 2);
  revalidatePath("/review");
}

export async function finishReviewSessionAction() {
  const user = await requireLearner();
  await awardXp(user.id, XP_REWARDS.reviewSession);
  await recordStudyDay(user.id);
  revalidatePath("/");
}

export async function markWordHardFormAction(formData: FormData) {
  const wordId = String(formData.get("wordId") ?? "");
  if (!wordId) return;
  await markWordHardAction(wordId);
}

export async function addWishFormAction(formData: FormData) {
  await addWishAction(String(formData.get("wish") ?? ""));
}

export async function markWordHardAction(wordId: string) {
  const user = await requireLearner();
  await prisma.reviewCard.upsert({
    where: { userId_wordId: { userId: user.id, wordId } },
    create: { userId: user.id, wordId, markedHard: true, interval: 0, dueDate: new Date() },
    update: { markedHard: true, dueDate: new Date() },
  });
  revalidatePath("/vocabulary");
  revalidatePath("/admin/progress");
}

export async function addWishAction(text: string) {
  const user = await requireLearner();
  const trimmed = text.trim();
  if (!trimmed) return;

  await prisma.wishItem.create({
    data: { userId: user.id, text: trimmed },
  });

  const tutor = await resolveTutorUserForLearner(user.id);
  if (tutor) {
    await createNotification(
      tutor.id,
      "wish_added",
      "New learning wish",
      `${user.displayName}: ${trimmed}`,
    );
  }

  await notifyTutor(
    "wish_added",
    `${user.displayName} wants to learn:\n"${trimmed}"\n\n${siteName()}`,
  );

  revalidatePath("/vocabulary");
  revalidatePath("/admin/progress");
}

export async function submitHomeworkAction(formData: FormData) {
  const user = await requireLearner();
  const homeworkId = String(formData.get("homeworkId") ?? "");
  const textAnswer = String(formData.get("textAnswer") ?? "").trim() || null;
  const audioPath = String(formData.get("audioPath") ?? "").trim() || null;

  if (!textAnswer && !audioPath) return;

  await prisma.homeworkSubmission.create({
    data: { homeworkId, userId: user.id, textAnswer, audioPath },
  });

  await prisma.homework.update({
    where: { id: homeworkId },
    data: { status: "SUBMITTED" },
  });

  await awardXp(user.id, XP_REWARDS.homeworkSubmit);
  await recordStudyDay(user.id);

  const homework = await prisma.homework.findUnique({ where: { id: homeworkId } });
  const tutor = await resolveTutorUserForLearner(user.id);
  if (tutor && homework) {
    await createNotification(
      tutor.id,
      "homework_submitted",
      "Homework submitted",
      `${user.displayName} submitted "${homework.title}".`,
    );
  }

  // 交作业不再立刻发邮件，改由每天 23:00 日报汇总

  revalidatePath("/homework");
  revalidatePath("/admin/homework");
}

export async function createHomeworkAction(formData: FormData) {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const audioPath = String(formData.get("audioPath") ?? "").trim() || null;
  if (!title) return;

  await prisma.homework.create({
    data: {
      assignedById: admin.id,
      title,
      description: description || null,
      audioPath, // Tutor 的语音留言
      payload: JSON.stringify({ type: "general" }),
    },
  });

  revalidatePath("/admin/homework");
  revalidatePath("/homework");
}

export async function reviewHomeworkAction(formData: FormData) {
  await requireAdmin();
  const submissionId = String(formData.get("submissionId") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim();

  const submission = await prisma.homeworkSubmission.update({
    where: { id: submissionId },
    data: { feedback, reviewedAt: new Date() },
    include: { homework: true },
  });

  await prisma.homework.update({
    where: { id: submission.homeworkId },
    data: { status: "REVIEWED" },
  });

  await createNotification(
    submission.userId,
    "homework_reviewed",
    "Homework feedback",
    `Tutor reviewed "${submission.homework.title}": ${feedback || "Great job!"}`,
  );

  revalidatePath("/admin/homework");
  revalidatePath("/homework");
}

export async function createWordAction(formData: FormData) {
  await requireAdmin();
  const simplified = String(formData.get("simplified") ?? "").trim();
  const pinyin = String(formData.get("pinyin") ?? "").trim();
  const pinyinNumber = String(formData.get("pinyinNumber") ?? "").trim();
  const english = String(formData.get("english") ?? "").trim();
  if (!simplified || !pinyin || !english) return;

  const word = await prisma.word.create({
    data: {
      simplified,
      pinyin,
      pinyinNumber: pinyinNumber || pinyin,
      english,
      tagalogShort: String(formData.get("tagalogShort") ?? "").trim() || null,
      hskLevel: Number(formData.get("hskLevel") ?? 1),
      isCustom: formData.get("isCustom") === "on",
    },
  });

  try {
    const { reindexWord } = await import("@/lib/ai");
    await reindexWord(word.id);
  } catch (err) {
    console.error("[createWordAction] knowledge index failed:", err);
  }

  revalidatePath("/admin/vocabulary");
}

export async function createLessonAction(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const maxOrder = await prisma.lesson.aggregate({ _max: { order: true } });

  await prisma.lesson.create({
    data: {
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      hskLevel: Number(formData.get("hskLevel") ?? 1),
      sceneTag: String(formData.get("sceneTag") ?? "").trim() || null,
      order: (maxOrder._max.order ?? 0) + 1,
      content: JSON.stringify({
        intro: "New lesson — open the editor to add content.",
        sentences: [],
        typingPrompts: [],
        quiz: [],
      }),
    },
  });

  revalidatePath("/admin/lessons");
  revalidatePath("/learn");
}

// 更新课程元信息（标题、描述、发布状态等）
export async function updateLessonMetaAction(
  lessonId: string,
  data: {
    title: string;
    description: string;
    hskLevel: number;
    sceneTag: string;
    published: boolean;
  },
) {
  await requireAdmin();
  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title: data.title.trim(),
      description: data.description.trim() || null,
      hskLevel: data.hskLevel,
      sceneTag: data.sceneTag.trim() || null,
      published: data.published,
    },
  });
  revalidatePath("/admin/lessons");
  revalidatePath(`/admin/lessons/${lessonId}/edit`);
  revalidatePath("/learn");
  revalidatePath(`/learn/${lessonId}`);
}

// 保存课程内容 JSON（intro / sentences / typing / quiz）
export async function updateLessonContentAction(
  lessonId: string,
  content: LessonContent,
) {
  await requireAdmin();
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { content: JSON.stringify(content) },
  });
  revalidatePath("/admin/lessons");
  revalidatePath(`/admin/lessons/${lessonId}/edit`);
  revalidatePath("/learn");
  revalidatePath(`/learn/${lessonId}`);
}

export async function completeListeningAction(score: number) {
  const user = await requireLearner();
  await awardXp(user.id, XP_REWARDS.listeningQuiz);
  await recordStudyDay(user.id);
  revalidatePath("/");
  revalidatePath("/listening");
  return { score };
}

export async function completeSpeakingAction(practicedCount: number) {
  const user = await requireLearner();
  await awardXp(user.id, XP_REWARDS.speakingPractice);
  await recordStudyDay(user.id);
  if (practicedCount >= 5) {
    await unlockBadge(user.id, "lin_phrases");
  }
  revalidatePath("/");
  revalidatePath("/speaking");
}

export async function completeTypingAction(score: number) {
  const user = await requireLearner();
  await awardXp(user.id, XP_REWARDS.listeningQuiz);
  await recordStudyDay(user.id);
  revalidatePath("/");
  revalidatePath("/typing");
  return { score };
}

export async function completeDictationAction(score: number) {
  const user = await requireLearner();
  await awardXp(user.id, XP_REWARDS.dictation);
  await recordStudyDay(user.id);
  revalidatePath("/");
  revalidatePath("/dictation");
  return { score };
}

export async function completeSmartQuizAction(score: number) {
  const user = await requireLearner();
  await awardXp(user.id, XP_REWARDS.smartQuiz);
  await recordStudyDay(user.id);
  revalidatePath("/");
  return { score };
}

export async function completeRoleplayAction() {
  const user = await requireLearner();
  await awardXp(user.id, XP_REWARDS.roleplay);
  await recordStudyDay(user.id);
  revalidatePath("/");
}

export async function completeHandwritingAction() {
  const user = await requireLearner();
  await awardXp(user.id, XP_REWARDS.handwriting);
  await recordStudyDay(user.id);
  revalidatePath("/");
}

// Tutor 在管理后台手动触发日报 / 周报（用于测试）
export async function sendDailyReportAction() {
  await requireAdmin();
  const { generateAndSendDailyReport } = await import("@/lib/daily-report");
  await generateAndSendDailyReport();
  revalidatePath("/admin/progress");
}

export async function sendWeeklyReportAction() {
  await requireAdmin();
  const { generateAndSendWeeklyReport } = await import("@/lib/weekly-report");
  await generateAndSendWeeklyReport();
  revalidatePath("/admin/progress");
}

let aiChatAwarded = new Set<string>();

export async function completeAiChatAction() {
  const user = await requireLearner();
  const key = `${user.id}-${new Date().toDateString()}`;
  if (aiChatAwarded.has(key)) return;
  aiChatAwarded.add(key);
  await awardXp(user.id, XP_REWARDS.aiChat);
  await recordStudyDay(user.id);
  revalidatePath("/");
  revalidatePath("/practice/ai");
}
