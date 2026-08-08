import {
  AI_CONFIG,
  FALLBACK_REPLY,
  TUTOR_SYSTEM_PROMPT,
  getDeepSeekBaseUrl,
} from "./config";
import { retrieve, formatContext } from "./retriever";
import type { AgentType, ChatMessage, RagContext } from "./types";

export async function buildRagContext(
  query: string,
  hskLevel?: number,
): Promise<RagContext> {
  const { results, retrievalMs } = await retrieve(query, {
    topK: AI_CONFIG.topK,
    rerankTopK: AI_CONFIG.rerankTopK,
    hskLevel,
  });

  return {
    query,
    results,
    contextText: formatContext(results),
    retrievalMs,
  };
}

export function buildSystemPrompt(
  agentType: AgentType,
  ragContext: RagContext,
  userContext?: { hskLevel?: number; dueWords?: string[] },
): string {
  const parts = [TUTOR_SYSTEM_PROMPT];

  if (userContext?.hskLevel) {
    parts.push(`\n## Learner progress\n- Current HSK level: ${userContext.hskLevel}`);
  }
  if (userContext?.dueWords?.length) {
    parts.push(`- Words due for review: ${userContext.dueWords.join(", ")}`);
  }

  const agentHints: Record<AgentType, string> = {
    vocabulary:
      "\n## Mode: Vocabulary tutor\nFocus on word meaning, pinyin, usage, and 1-2 example sentences.",
    grammar:
      "\n## Mode: Grammar tutor\nAnalyze sentence structure, explain grammar points, and gently correct errors.",
    practice:
      "\n## Mode: Conversation practice\nStart or continue a scenario dialogue. Ask follow-up questions.",
    report:
      "\n## Mode: Learning report\nSummarize progress warmly, highlight strengths, suggest next steps.",
    general: "",
  };
  parts.push(agentHints[agentType]);

  if (ragContext.contextText) {
    parts.push(`\n${ragContext.contextText}`);
  }

  return parts.join("\n");
}

export function truncateMessages(
  messages: ChatMessage[],
  maxMessages: number = AI_CONFIG.maxHistoryMessages,
): ChatMessage[] {
  if (messages.length <= maxMessages) return messages;
  return messages.slice(-maxMessages);
}

export async function summarizeIfNeeded(
  messages: ChatMessage[],
  apiKey: string,
): Promise<{ messages: ChatMessage[]; summary?: string }> {
  const maxChars = AI_CONFIG.maxContextTokens * 3;
  const totalChars = messages.reduce((s, m) => s + m.content.length, 0);

  if (totalChars < maxChars || messages.length <= 6) {
    return { messages: truncateMessages(messages) };
  }

  const older = messages.slice(0, -4);
  const recent = messages.slice(-4);

  const res = await fetch(`${getDeepSeekBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.chatModel,
      messages: [
        {
          role: "system",
          content:
            "Summarize this Mandarin learning chat in 2-3 sentences. Keep key vocabulary and topics.",
        },
        {
          role: "user",
          content: older.map((m) => `${m.role}: ${m.content}`).join("\n"),
        },
      ],
      max_tokens: 150,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    return { messages: truncateMessages(messages) };
  }

  const data = await res.json();
  const summary = data.choices?.[0]?.message?.content ?? "";

  return {
    messages: [
      { role: "system", content: `Previous conversation summary: ${summary}` },
      ...recent,
    ],
    summary,
  };
}

export async function* streamChatCompletion(
  systemPrompt: string,
  messages: ChatMessage[],
  apiKey: string,
): AsyncGenerator<string, { latencyMs: number; tokensOut: number }, unknown> {
  const start = performance.now();
  let tokensOut = 0;

  const res = await fetch(`${getDeepSeekBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.chatModel,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.8,
      max_tokens: 500,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[deepseek stream]", res.status, err);
    yield FALLBACK_REPLY;
    return { latencyMs: Math.round(performance.now() - start), tokensOut: 0 };
  }

  const reader = res.body?.getReader();
  if (!reader) {
    yield FALLBACK_REPLY;
    return { latencyMs: Math.round(performance.now() - start), tokensOut: 0 };
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const payload = trimmed.slice(6);
      if (payload === "[DONE]") continue;

      try {
        const parsed = JSON.parse(payload);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          tokensOut += delta.length;
          yield delta;
        }
      } catch {
        // skip malformed SSE chunks
      }
    }
  }

  return { latencyMs: Math.round(performance.now() - start), tokensOut };
}

export async function chatCompletion(
  systemPrompt: string,
  messages: ChatMessage[],
  apiKey: string,
): Promise<{ reply: string; latencyMs: number }> {
  const start = performance.now();

  const res = await fetch(`${getDeepSeekBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.chatModel,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.8,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    console.error("[deepseek]", res.status, await res.text());
    return { reply: FALLBACK_REPLY, latencyMs: Math.round(performance.now() - start) };
  }

  const data = await res.json();
  return {
    reply: data.choices?.[0]?.message?.content ?? FALLBACK_REPLY,
    latencyMs: Math.round(performance.now() - start),
  };
}
