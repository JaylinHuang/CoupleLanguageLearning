import type { KnowledgeDocument, SourceType } from "./types";

export function buildWordDocument(word: {
  id: string;
  simplified: string;
  pinyin: string;
  pinyinNumber: string;
  english: string;
  tagalogShort: string | null;
  hskLevel: number;
  notes: string | null;
}): KnowledgeDocument {
  const content = [
    `词汇: ${word.simplified}`,
    `拼音: ${word.pinyin} (${word.pinyinNumber})`,
    `英文: ${word.english}`,
    word.tagalogShort ? `Tagalog: ${word.tagalogShort}` : null,
    word.notes ? `备注: ${word.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    sourceType: "word",
    sourceId: word.id,
    hskLevel: word.hskLevel,
    content,
    metadata: {
      simplified: word.simplified,
      pinyin: word.pinyin,
      english: word.english,
    },
  };
}

export type IndexFilter = {
  incremental?: boolean;
  skipWords?: boolean;
  typeOnly?: SourceType;
};

export function needsReindex(
  sourceUpdatedAt: Date,
  chunk: { updatedAt: Date; content: string } | undefined,
  expectedContent: string,
): boolean {
  if (!chunk) return true;
  if (chunk.content !== expectedContent) return true;
  return sourceUpdatedAt > chunk.updatedAt;
}
