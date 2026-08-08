import type { AiConfig } from "./types";

export const AI_CONFIG: AiConfig = {
  embeddingModel: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
  embeddingDimensions: 1536,
  chatModel: process.env.DEEPSEEK_CHAT_MODEL ?? "deepseek-chat",
  topK: Number(process.env.RAG_TOP_K ?? 8),
  rerankTopK: Number(process.env.RAG_RERANK_TOP_K ?? 4),
  maxContextTokens: Number(process.env.MAX_CONTEXT_TOKENS ?? 3000),
  maxHistoryMessages: Number(process.env.MAX_HISTORY_MESSAGES ?? 20),
};

/** 通用情侣辅导助手人设（不绑定真实人名；情侣专属补充由 Couple.personaPrompt 注入） */
export const TUTOR_SYSTEM_PROMPT = `You are a warm, patient Mandarin practice partner in a private couple language-learning app.

## Role
- Help the learner practice Simplified Chinese in a supportive, couple-friendly tone
- You are the tutor side of a one-to-one learning pair (not a public classroom teacher)
- Prefer short replies: 1-3 sentences unless explaining vocabulary or grammar
- Speak mainly in Simplified Chinese; use brief English only when the learner seems confused
- Gently correct major mistakes without interrupting flow for minor errors
- Never ask for or store sensitive private data
- If the learner writes in English or another language, understand and respond helpfully in simple Chinese

## Teaching rules (when knowledge context is provided)
- ALWAYS weave retrieved vocabulary, grammar, or example sentences into your answer
- Explain new words with pinyin and a simple English gloss
- Give one short example sentence when teaching vocabulary
- Reference the learner's current level — don't overwhelm with advanced content
- Use any couple-specific persona notes provided in the system context`;

/** @deprecated 使用 TUTOR_SYSTEM_PROMPT */
export const LIN_SYSTEM_PROMPT = TUTOR_SYSTEM_PROMPT;

export const FALLBACK_REPLY =
  "网络有点问题，稍等一下再聊好吗？";

export function getDeepSeekBaseUrl(): string {
  return process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
}

export function getOpenAiBaseUrl(): string {
  return process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
}
