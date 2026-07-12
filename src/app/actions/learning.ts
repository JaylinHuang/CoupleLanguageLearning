"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  awardXp,
  recordStudyDay,
  addWordsToReview,
  unlockBadge,
  createNotification,
} from "@/lib/progress";
import { XP_REWARDS } from "@/lib/constants";
import { notifyLin } from "@/lib/email";
import { requireLearner, requireAdmin } from "./auth";
import { sm2, type ReviewQuality } from "@/lib/srs";

export async function completeLessonAction(lessonId: string, score: number) {
  const user = await requireLearner();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { words: true },
  });
  if (!lesson) throw new Error("Lesson not found");

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
  await awardXp(user.id, XP_REWARDS.lessonComplete);
  await recordStudyDay(user.id);

  const completedCount = await prisma.lessonProgress.count({
    where: { userId: user.id, status: "COMPLETED" },
  });
  if (completedCount === 1) {
    await unlockBadge(user.id, "first_lesson");
  }

  const lin = await prisma.user.findUnique({ where: { username: "lin" } });
  if (lin) {
    await createNotification(
      lin.id,
      "study_complete",
      "Lesson completed",
      `${user.displayName} completed "${lesson.title}" with score ${score}%.`,
    );
  }

  await notifyLin(
    "study_complete",
    `Erika completed lesson "${lesson.title}" with score ${score}%.\n\nJaylin_love_Erika`,
  );

  revalidatePath("/");
  revalidatePath("/learn");
  revalidatePath("/admin");
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

  const lin = await prisma.user.findUnique({ where: { username: "lin" } });
  if (lin) {
    await createNotification(
      lin.id,
      "wish_added",
      "New learning wish",
      `${user.displayName}: ${trimmed}`,
    );
  }

  await notifyLin(
    "wish_added",
    `Erika wants to learn:\n"${trimmed}"\n\nJaylin_love_Erika`,
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
  const lin = await prisma.user.findUnique({ where: { username: "lin" } });
  if (lin && homework) {
    await createNotification(
      lin.id,
      "homework_submitted",
      "Homework submitted",
      `${user.displayName} submitted "${homework.title}".`,
    );
  }

  await notifyLin(
    "homework_submitted",
    `Erika submitted homework: "${homework?.title ?? homeworkId}"${audioPath ? " (with voice recording)" : ""}\n\nJaylin_love_Erika`,
  );

  revalidatePath("/homework");
  revalidatePath("/admin/homework");
}

export async function createHomeworkAction(formData: FormData) {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) return;

  await prisma.homework.create({
    data: {
      assignedById: admin.id,
      title,
      description: description || null,
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
    `Lin reviewed "${submission.homework.title}": ${feedback || "Great job!"}`,
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
        intro: "New lesson — add content via admin later.",
        sentences: [],
        typingPrompts: [],
        quiz: [],
      }),
    },
  });

  revalidatePath("/admin/lessons");
  revalidatePath("/learn");
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
