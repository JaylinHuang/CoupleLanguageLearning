"use client";

import { useRef, useState } from "react";
import { completeAiChatAction } from "@/app/actions/learning";
import { SpeakButton } from "@/components/speak-button";
import { VoiceInputButton } from "@/components/voice-input";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "What does 想 mean?",
  "Tell me about your hometown Chenzhou.",
  "Let's practice ordering food in Chinese.",
];

function chineseForTTS(text: string): string {
  const parts = text.match(/[\u4e00-\u9fff]+/g);
  return parts?.join("") ?? text;
}

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "你好！我是你的 AI 学习伙伴。今天想练中文、聊天都可以～",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [turns, setTurns] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastMeta, setLastMeta] = useState<{
    agent?: string;
    retrievalMs?: number;
    ragHits?: number;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  function scrollToBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading || streaming) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userMsg: Message = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setStreaming(true);
    setLastMeta(null);

    const assistantIndex = nextMessages.length;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, sessionId }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Chat failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split("\n");
          let event = "message";
          let data = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) event = line.slice(7);
            if (line.startsWith("data: ")) data = line.slice(6);
          }

          if (!data) continue;
          const parsed = JSON.parse(data);

          if (event === "meta") {
            setSessionId(parsed.sessionId ?? sessionId);
            setLastMeta({
              agent: parsed.agent,
              retrievalMs: parsed.retrievalMs,
              ragHits: parsed.ragHits,
            });
          } else if (event === "token") {
            fullReply += parsed.content;
            setMessages((prev) => {
              const copy = [...prev];
              copy[assistantIndex] = { role: "assistant", content: fullReply };
              return copy;
            });
            scrollToBottom();
          } else if (event === "error") {
            throw new Error(parsed.message);
          }
        }
      }

      const newTurns = turns + 1;
      setTurns(newTurns);
      if (newTurns >= 3 && !xpAwarded) {
        await completeAiChatAction();
        setXpAwarded(true);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setMessages((prev) => {
        const copy = [...prev];
        copy[assistantIndex] = {
          role: "assistant",
          content:
            err instanceof Error
              ? `Sorry, something went wrong: ${err.message}`
              : "Sorry, something went wrong.",
        };
        return copy;
      });
    } finally {
      setLoading(false);
      setStreaming(false);
      scrollToBottom();
    }
  }

  return (
    <div className="flex h-[70dvh] flex-col">
      <div className="card flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-coral text-white"
                  : "bg-blush/60 text-warm-brown"
              }`}
            >
              {m.role === "assistant" ? (
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-coral-dark">Tutor AI</p>
                  {m.content ? (
                    <SpeakButton
                      text={chineseForTTS(m.content)}
                      label=""
                      className="text-xs text-coral-dark opacity-70 hover:opacity-100"
                    />
                  ) : null}
                </div>
              ) : null}
              <p className="whitespace-pre-wrap">
                {m.content}
                {streaming && i === messages.length - 1 && m.role === "assistant" ? (
                  <span className="ml-0.5 inline-block animate-pulse">▍</span>
                ) : null}
              </p>
            </div>
          </div>
        ))}
        {loading && !streaming ? (
          <p className="text-sm text-warm-gray">Partner is typing...</p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {lastMeta?.ragHits ? (
        <p className="mt-2 text-center text-xs text-warm-gray">
          RAG: {lastMeta.ragHits} hits · {lastMeta.retrievalMs}ms
          {lastMeta.agent ? ` · ${lastMeta.agent} agent` : ""}
        </p>
      ) : null}

      {turns >= 3 && xpAwarded ? (
        <p className="mt-3 text-center text-xs text-success">
          +5 XP earned for chatting with Tutor AI today!
        </p>
      ) : turns >= 3 ? null : (
        <div className="mt-3 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              className="badge cursor-pointer hover:bg-coral hover:text-white"
              onClick={() => sendMessage(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <input
          className="input"
          placeholder="Say something to your AI partner..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || streaming}
        />
        <VoiceInputButton
          disabled={loading || streaming}
          onTranscript={(text) => {
            setInput(text);
            if (text.trim()) sendMessage(text);
          }}
        />
        <button
          type="submit"
          className="btn-primary shrink-0"
          disabled={loading || streaming}
        >
          Send
        </button>
      </form>
    </div>
  );
}
