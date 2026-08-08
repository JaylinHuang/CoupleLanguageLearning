/** chunker.v1 — 情侣语料切块 */

export type ChunkPreset = "fine" | "standard" | "article";

export const CHUNKER_VERSION = "chunker.v1";

const PRESETS: Record<
  ChunkPreset,
  { targetChars: number; overlapChars: number; maxChars: number; minChars: number }
> = {
  fine: { targetChars: 400, overlapChars: 60, maxChars: 600, minChars: 60 },
  standard: { targetChars: 700, overlapChars: 80, maxChars: 1000, minChars: 80 },
  article: { targetChars: 1000, overlapChars: 100, maxChars: 1200, minChars: 80 },
};

export const IMPORT_LIMITS = {
  maxFileBytes: 2 * 1024 * 1024,
  maxCharsPerImport: 150_000,
  maxChunksPerImport: 400,
};

export function chunkPlaintext(
  text: string,
  preset: ChunkPreset = "standard",
): string[] {
  const { targetChars, overlapChars, maxChars, minChars } = PRESETS[preset];
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n\s*\n/);
  const pieces: string[] = [];
  let buf = "";

  const flush = () => {
    const t = buf.trim();
    if (t) pieces.push(t);
    buf = "";
  };

  for (const p of paragraphs) {
    if ((buf + "\n\n" + p).length <= targetChars) {
      buf = buf ? `${buf}\n\n${p}` : p;
      continue;
    }
    if (buf) flush();
    if (p.length <= maxChars) {
      buf = p;
      continue;
    }
    // 硬切长段
    let i = 0;
    while (i < p.length) {
      let end = Math.min(i + targetChars, p.length);
      if (end < p.length) {
        const window = p.slice(i, Math.min(i + maxChars, p.length));
        const punct = Math.max(
          window.lastIndexOf("。"),
          window.lastIndexOf("！"),
          window.lastIndexOf("？"),
          window.lastIndexOf("\n"),
          window.lastIndexOf(". "),
        );
        if (punct > minChars) end = i + punct + 1;
      }
      pieces.push(p.slice(i, end).trim());
      i = Math.max(end - overlapChars, end);
    }
    buf = "";
  }
  flush();

  // 合并过短尾块
  const merged: string[] = [];
  for (const c of pieces) {
    if (!c) continue;
    if (merged.length && c.length < minChars) {
      merged[merged.length - 1] = `${merged[merged.length - 1]}\n${c}`;
    } else {
      merged.push(c);
    }
  }
  return merged.slice(0, IMPORT_LIMITS.maxChunksPerImport);
}
