import { FALLBACK_REPLY } from "../config";
import {
  buildRagContext,
  buildSystemPrompt,
  summarizeIfNeeded,
  streamChatCompletion,
  chatCompletion,
} from "../rag-pipeline";
import {
  classifyIntent,
  getUserLearningContext,
  AGENT_HANDLERS,
} from "../agents/router";
import {
  logAiCall,
  getOrCreateSession,
  saveChatMessage,
} from "../observability";
import type { ChatMessage, StreamEvent } from "../types";

export type ChatStreamInput = {
  userId: string;
  messages: ChatMessage[];
  sessionId?: string;
};

export async function* runChatStream(
  input: ChatStreamInput,
): AsyncGenerator<StreamEvent | { type: "done"; latencyMs: number; generationMs: number; tokensOut: number }> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    yield { type: "error", message: "DeepSeek API key not configured" };
    return;
  }

  const lastUserMsg = [...input.messages].reverse().find((m) => m.role === "user");
  if (!lastUserMsg) {
    yield { type: "error", message: "No user message" };
    return;
  }

  const intent = classifyIntent(lastUserMsg.content);
  const userCtx = await getUserLearningContext(input.userId);
  const agentConfig = AGENT_HANDLERS[intent.agent](lastUserMsg.content, userCtx);
  const ragContext = await buildRagContext(lastUserMsg.content, userCtx.hskLevel);

  let systemPrompt = buildSystemPrompt(intent.agent, ragContext, {
    hskLevel: userCtx.hskLevel,
    dueWords: userCtx.dueWords,
  });
  if (agentConfig.extraPrompt) {
    systemPrompt += `\n\n${agentConfig.extraPrompt}`;
  }

  const { messages: trimmedMessages, summary } = await summarizeIfNeeded(
    input.messages.filter((m) => m.role !== "system"),
    apiKey,
  );

  const chatSession = input.sessionId
    ? { id: input.sessionId }
    : await getOrCreateSession(input.userId, intent.agent);

  yield {
    type: "meta",
    data: {
      agent: intent.agent,
      retrievalMs: ragContext.retrievalMs,
      ragHits: ragContext.results.length,
      sessionId: chatSession.id,
      summaryApplied: !!summary,
    },
  };

  let fullReply = "";
  const streamStart = performance.now();

  try {
    const generator = streamChatCompletion(systemPrompt, trimmedMessages, apiKey);
    let result = await generator.next();

    while (!result.done) {
      fullReply += result.value;
      yield { type: "token", content: result.value };
      result = await generator.next();
    }

    const genResult = result.value ?? { latencyMs: 0, tokensOut: 0 };
    const totalMs = Math.round(performance.now() - streamStart);

    yield {
      type: "done",
      latencyMs: totalMs,
      generationMs: genResult.latencyMs,
      tokensOut: genResult.tokensOut,
    };

    await saveChatMessage(chatSession.id, "user", lastUserMsg.content, {
      agent: intent.agent,
      ragSources: ragContext.results.map((r) => r.id),
    });
    await saveChatMessage(chatSession.id, "assistant", fullReply, {
      agent: intent.agent,
      retrievalMs: ragContext.retrievalMs,
    });

    await logAiCall({
      userId: input.userId,
      endpoint: "/v1/chat/stream",
      prompt: systemPrompt.slice(0, 4000),
      response: fullReply,
      latencyMs: totalMs,
      tokensOut: genResult.tokensOut,
      metadata: {
        agent: intent.agent,
        ragHits: ragContext.results.length,
        retrievalMs: ragContext.retrievalMs,
      },
    });
  } catch (err) {
    console.error("[chat/stream]", err);
    yield { type: "error", message: FALLBACK_REPLY };
  }
}

export async function runChat(input: ChatStreamInput) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return { error: "DeepSeek API key not configured", status: 500 as const };
  }

  const lastUserMsg = [...input.messages].reverse().find((m) => m.role === "user");
  if (!lastUserMsg) {
    return { error: "No user message", status: 400 as const };
  }

  const intent = classifyIntent(lastUserMsg.content);
  const userCtx = await getUserLearningContext(input.userId);
  const agentConfig = AGENT_HANDLERS[intent.agent](lastUserMsg.content, userCtx);
  const ragContext = await buildRagContext(lastUserMsg.content, userCtx.hskLevel);

  let systemPrompt = buildSystemPrompt(intent.agent, ragContext, {
    hskLevel: userCtx.hskLevel,
    dueWords: userCtx.dueWords,
  });
  if (agentConfig.extraPrompt) {
    systemPrompt += `\n\n${agentConfig.extraPrompt}`;
  }

  const { messages: trimmedMessages } = await summarizeIfNeeded(
    input.messages.filter((m) => m.role !== "system"),
    apiKey,
  );

  const start = performance.now();
  const { reply, latencyMs } = await chatCompletion(systemPrompt, trimmedMessages, apiKey);

  await logAiCall({
    userId: input.userId,
    endpoint: "/v1/chat",
    prompt: systemPrompt.slice(0, 4000),
    response: reply,
    latencyMs: Math.round(performance.now() - start),
    metadata: {
      agent: intent.agent,
      ragHits: ragContext.results.length,
      retrievalMs: ragContext.retrievalMs,
      generationMs: latencyMs,
    },
  });

  return {
    reply,
    meta: {
      agent: intent.agent,
      retrievalMs: ragContext.retrievalMs,
      ragHits: ragContext.results.length,
    },
  };
}
