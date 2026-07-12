import { embedText } from "./embeddings";
import { searchKnowledge } from "./vector-store";
import type { RetrievalResult } from "./types";

function keywordBoost(query: string, result: RetrievalResult): number {
  const q = query.toLowerCase();
  const meta = result.metadata;
  let boost = 0;

  if (meta.simplified && q.includes(meta.simplified)) boost += 0.3;
  if (meta.english && q.includes(meta.english.toLowerCase())) boost += 0.15;
  if (meta.pinyin && q.includes(meta.pinyin.toLowerCase())) boost += 0.1;
  if (meta.grammarPoint && q.includes(meta.grammarPoint.toLowerCase())) boost += 0.2;

  const chineseChars = query.match(/[\u4e00-\u9fff]+/g);
  if (chineseChars) {
    for (const chars of chineseChars) {
      if (result.content.includes(chars)) boost += 0.25;
    }
  }

  return boost;
}

export async function retrieve(
  query: string,
  options: {
    topK?: number;
    rerankTopK?: number;
    hskLevel?: number;
  } = {},
): Promise<{ results: RetrievalResult[]; retrievalMs: number }> {
  const start = performance.now();
  const topK = options.topK ?? 8;
  const rerankTopK = options.rerankTopK ?? 4;

  const queryEmbedding = await embedText(query);
  const candidates = await searchKnowledge(queryEmbedding, {
    topK,
    hskLevel: options.hskLevel,
  });

  const reranked = candidates
    .map((r) => ({
      ...r,
      score: r.score + keywordBoost(query, r),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, rerankTopK);

  return {
    results: reranked,
    retrievalMs: Math.round(performance.now() - start),
  };
}

export function formatContext(results: RetrievalResult[]): string {
  if (results.length === 0) return "";

  const lines = results.map((r, i) => {
    const tag = r.sourceType.toUpperCase();
    const level = r.hskLevel ? ` HSK${r.hskLevel}` : "";
    return `[${i + 1}] (${tag}${level}) ${r.content}`;
  });

  return `## Retrieved knowledge (use in your answer)\n${lines.join("\n")}`;
}
