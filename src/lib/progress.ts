import { prisma } from "./db";
import { XP_REWARDS, calculateLevel, xpForLevel } from "./constants";
import { isSameDay, startOfDay } from "./srs";

export async function ensureUserProgress(userId: string) {
  return prisma.userProgress.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function awardXp(userId: string, amount: number) {
  const progress = await ensureUserProgress(userId);
  const newXp = progress.xp + amount;
  const newLevel = calculateLevel(newXp);

  return prisma.userProgress.update({
    where: { userId },
    data: { xp: newXp, level: newLevel },
  });
}

export async function recordStudyDay(userId: string) {
  const progress = await ensureUserProgress(userId);
  const today = startOfDay(new Date());
  const last = progress.lastStudyDate
    ? startOfDay(progress.lastStudyDate)
    : null;

  if (last && isSameDay(last, today)) {
    return progress;
  }

  let streak = progress.streak;
  if (!last) {
    streak = 1;
  } else {
    const diffDays = Math.round(
      (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
    );
    streak = diffDays === 1 ? progress.streak + 1 : 1;
  }

  const longestStreak = Math.max(progress.longestStreak, streak);

  return prisma.userProgress.update({
    where: { userId },
    data: {
      streak,
      longestStreak,
      lastStudyDate: new Date(),
      xp: progress.xp + XP_REWARDS.dailyCheckIn,
      level: calculateLevel(progress.xp + XP_REWARDS.dailyCheckIn),
    },
  });
}

export async function unlockBadge(userId: string, badgeId: string) {
  const existing = await prisma.achievement.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  });
  if (existing) return existing;

  return prisma.achievement.create({
    data: { userId, badgeId },
  });
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
) {
  return prisma.notification.create({
    data: { userId, type, title, message },
  });
}

export async function addWordsToReview(userId: string, wordIds: string[]) {
  for (const wordId of wordIds) {
    await prisma.reviewCard.upsert({
      where: { userId_wordId: { userId, wordId } },
      create: { userId, wordId },
      update: {},
    });
  }
}

export { xpForLevel, calculateLevel };
