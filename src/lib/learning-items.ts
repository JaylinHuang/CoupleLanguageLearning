import { prisma } from "@/lib/db";

/** 由遗留 Word 解析 LearningItem（双读适配） */
export async function resolveLearningItemIdForWord(wordId: string) {
  const existing = await prisma.learningItem.findFirst({
    where: { sourceRef: `word:${wordId}` },
    select: { id: true },
  });
  return existing?.id ?? null;
}

export async function ensureLearningItemForWord(wordId: string) {
  const found = await resolveLearningItemIdForWord(wordId);
  if (found) return found;

  const w = await prisma.word.findUnique({ where: { id: wordId } });
  if (!w) return null;

  const item = await prisma.learningItem.create({
    data: {
      subjectId: "chinese",
      itemType: "chinese_word",
      title: w.simplified,
      meaningPrimary: w.english,
      meaningSecondary: w.tagalogShort,
      tags: "[]",
      audioUrl: w.audioUrl,
      notes: w.notes,
      scope: "SHARED",
      sourceRef: `word:${w.id}`,
      chineseExt: {
        create: {
          simplified: w.simplified,
          traditional: w.traditional,
          pinyin: w.pinyin,
          pinyinNumber: w.pinyinNumber,
          hskLevel: w.hskLevel,
        },
      },
    },
  });
  return item.id;
}
