export { AI_CONFIG, LIN_SYSTEM_PROMPT, FALLBACK_REPLY } from "./config";
export type * from "./types";
export { embedText, embedBatch, cosineSimilarity } from "./embeddings";
export {
  upsertKnowledge,
  upsertKnowledgeBatch,
  deleteKnowledgeBySource,
  searchKnowledge,
  getKnowledgeStats,
} from "./vector-store";
export { retrieve, formatContext } from "./retriever";
export {
  buildRagContext,
  buildSystemPrompt,
  truncateMessages,
  summarizeIfNeeded,
  streamChatCompletion,
  chatCompletion,
} from "./rag-pipeline";
export {
  classifyIntent,
  getUserLearningContext,
  AGENT_HANDLERS,
} from "./agents/router";
export { logAiCall, getOrCreateSession, saveChatMessage } from "./observability";
export { runChatStream, runChat } from "./handlers/chat";
export type { ChatStreamInput } from "./handlers/chat";
export { buildWordDocument, needsReindex } from "./indexing";
export type { IndexFilter } from "./indexing";
export { reindexWord } from "./knowledge-admin";
