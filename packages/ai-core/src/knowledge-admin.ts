import { prisma } from "./db";
import { upsertKnowledge } from "./vector-store";

export async function reindexWord(sourceId: string): Promise<string | null> {
  const word = await prisma.word.findUnique({ where: { id: sourceId } });
  if (!word) return null;

  const content = [
    `词汇: ${word.simplified}`,
    `拼音: ${word.pinyin} (${word.pinyinNumber})`,
    `英文: ${word.english}`,
    word.tagalogShort ? `Tagalog: ${word.tagalogShort}` : null,
    word.notes ? `备注: ${word.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return upsertKnowledge({
    sourceType: "word",
    sourceId: word.id,
    hskLevel: word.hskLevel,
    content,
    metadata: {
      simplified: word.simplified,
      pinyin: word.pinyin,
      english: word.english,
    },
  });
}
