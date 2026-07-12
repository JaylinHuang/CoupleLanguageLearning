export type SourceType = "word" | "grammar" | "example" | "lesson" | "culture";

export type KnowledgeMetadata = {
  simplified?: string;
  pinyin?: string;
  english?: string;
  grammarPoint?: string;
  exampleSentence?: string;
  lessonTitle?: string;
  [key: string]: string | number | undefined;
};

export type KnowledgeDocument = {
  id?: string;
  sourceType: SourceType;
  sourceId?: string;
  hskLevel?: number;
  content: string;
  metadata: KnowledgeMetadata;
};

export type RetrievalResult = {
  id: string;
  sourceType: SourceType;
  sourceId: string | null;
  hskLevel: number | null;
  content: string;
  metadata: KnowledgeMetadata;
  score: number;
};

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type AgentType =
  | "vocabulary"
  | "grammar"
  | "practice"
  | "report"
  | "general";

export type IntentResult = {
  agent: AgentType;
  confidence: number;
  reason: string;
};

export type RagContext = {
  query: string;
  results: RetrievalResult[];
  contextText: string;
  retrievalMs: number;
};

export type StreamEvent =
  | { type: "token"; content: string }
  | { type: "meta"; data: Record<string, unknown> }
  | { type: "done"; latencyMs: number; generationMs?: number; tokensOut?: number }
  | { type: "error"; message: string };

export type AiConfig = {
  embeddingModel: string;
  embeddingDimensions: number;
  chatModel: string;
  topK: number;
  rerankTopK: number;
  maxContextTokens: number;
  maxHistoryMessages: number;
};
