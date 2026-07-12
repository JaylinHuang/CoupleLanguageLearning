import { AI_CONFIG, getOpenAiBaseUrl } from "./config";

function hashToVector(text: string, dims: number): number[] {
  const vec = new Array<number>(dims).fill(0);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    vec[i % dims] += Math.sin(code * (i + 1)) * 0.01;
    vec[(i * 7 + 3) % dims] += Math.cos(code * (i + 2)) * 0.01;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return hashToVector(text, AI_CONFIG.embeddingDimensions);
  }

  const res = await fetch(`${getOpenAiBaseUrl()}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.embeddingModel,
      input: text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[embeddings]", res.status, err);
    return hashToVector(text, AI_CONFIG.embeddingDimensions);
  }

  const data = await res.json();
  return data.data[0].embedding as number[];
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return texts.map((t) => hashToVector(t, AI_CONFIG.embeddingDimensions));
  }

  const res = await fetch(`${getOpenAiBaseUrl()}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.embeddingModel,
      input: texts,
    }),
  });

  if (!res.ok) {
    console.error("[embeddings batch]", res.status, await res.text());
    return texts.map((t) => hashToVector(t, AI_CONFIG.embeddingDimensions));
  }

  const data = await res.json();
  return (data.data as Array<{ index: number; embedding: number[] }>)
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function serializeEmbedding(vec: number[]): string {
  return JSON.stringify(vec);
}

export function deserializeEmbedding(raw: string | null): number[] | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as number[];
  } catch {
    return null;
  }
}
