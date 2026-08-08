import { prisma } from "@/lib/db";

export type VocabLevelStat = {
  hskLevel: number;
  total: number; // 该级别词库总词数
  learning: number; // 已加入复习但未掌握
  mastered: number; // 已掌握（间隔 >= 21 天或复习次数 >= 4，同 Anki 成熟卡标准）
};

// 按 HSK 等级统计 learner 的词汇掌握情况（Profile 和 Tutor Progress 共用）
export async function getVocabStats(userId: string): Promise<VocabLevelStat[]> {
  const totals = await prisma.word.groupBy({
    by: ["hskLevel"],
    _count: { _all: true },
  });

  const cards = await prisma.reviewCard.findMany({
    where: { userId, wordId: { not: null } },
    select: {
      interval: true,
      repetitions: true,
      word: { select: { hskLevel: true } },
    },
  });

  const byLevel = new Map<number, { learning: number; mastered: number }>();
  for (const card of cards) {
    if (!card.word) continue;
    const level = card.word.hskLevel;
    const entry = byLevel.get(level) ?? { learning: 0, mastered: 0 };
    if (card.interval >= 21 || card.repetitions >= 4) {
      entry.mastered += 1;
    } else {
      entry.learning += 1;
    }
    byLevel.set(level, entry);
  }

  return totals
    .map((t) => ({
      hskLevel: t.hskLevel,
      total: t._count._all,
      learning: byLevel.get(t.hskLevel)?.learning ?? 0,
      mastered: byLevel.get(t.hskLevel)?.mastered ?? 0,
    }))
    .sort((a, b) => a.hskLevel - b.hskLevel);
}
