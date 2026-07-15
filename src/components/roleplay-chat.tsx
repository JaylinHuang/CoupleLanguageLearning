"use client";

import { useRef, useState } from "react";
import { completeRoleplayAction } from "@/app/actions/learning";
import { SpeakButton } from "@/components/speak-button";
import { VoiceInputButton } from "@/components/voice-input";
import type { RoleplayScenario } from "@/lib/roleplay";

type Message = { role: "user" | "assistant"; content: string };

function chineseForTTS(text: string): string {
  const parts = text.match(/[\u4e00-\u9fff，。！？]+/g);
  return parts?.join("") ?? text;
}

export function RoleplayChat({ scenarios }: { scenarios: RoleplayScenario[] }) {
  const [scenario, setScenario] = useState<RoleplayScenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [xpAwarded, setXpAwarded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function startScenario(s: RoleplayScenario) {
    setScenario(s);
    setMessages([{ role: "assistant", content: s.opening }]);
    setFeedback(null);
    setXpAwarded(false);
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading || !scenario || feedback) return;

    const next: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch("/api/roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: scenario.id, messages: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Chat failed");
      }
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            err instanceof Error ? `(${err.message})` : "(Something went wrong)",
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  async function endAndGetFeedback() {
    if (!scenario || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          messages,
          feedback: true,
        }),
      });
      if (!res.ok) throw new Error("Feedback failed");
      const data = await res.json();
      setFeedback(data.reply);
      if (!xpAwarded) {
        await completeRoleplayAction();
        setXpAwarded(true);
      }
    } catch {
      setFeedback("Feedback is unavailable right now, but great practice!");
    } finally {
      setLoading(false);
    }
  }

  // 场景选择界面
  if (!scenario) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => startScenario(s)}
            className="card p-5 text-left transition hover:border-coral hover:shadow-md"
          >
            <p className="text-3xl">{s.emoji}</p>
            <p className="mt-2 font-medium text-warm-brown">{s.title}</p>
            <p className="font-chinese text-sm text-coral-dark">{s.titleZh}</p>
            <p className="mt-1 text-xs text-warm-gray">{s.description}</p>
          </button>
        ))}
      </div>
    );
  }

  const userTurns = messages.filter((m) => m.role === "user").length;

  return (
    <div className="flex h-[70dvh] flex-col">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-warm-brown">
          {scenario.emoji} {scenario.title}
        </p>
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => setScenario(null)}
        >
          ← Scenarios
        </button>
      </div>

      <div className="card flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
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
                  <p className="text-xs font-medium text-coral-dark">
                    {scenario.emoji} {scenario.titleZh}
                  </p>
                  <SpeakButton
                    text={chineseForTTS(m.content)}
                    label=""
                    className="text-xs text-coral-dark opacity-70 hover:opacity-100"
                  />
                </div>
              ) : null}
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading ? <p className="text-sm text-warm-gray">...</p> : null}

        {feedback ? (
          <div className="rounded-2xl border border-coral/40 bg-white p-4">
            <p className="text-xs font-medium text-coral-dark">
              📝 Teacher feedback {xpAwarded ? "· +10 XP" : ""}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{feedback}</p>
            <button
              type="button"
              className="btn-primary mt-3"
              onClick={() => setScenario(null)}
            >
              Try another scenario
            </button>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {!feedback ? (
        <>
          {userTurns >= 3 ? (
            <button
              type="button"
              className="btn-secondary mt-2 text-sm"
              disabled={loading}
              onClick={endAndGetFeedback}
            >
              🏁 End conversation & get feedback
            </button>
          ) : null}
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              className="input"
              placeholder="Reply in Chinese (or pinyin)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <VoiceInputButton
              disabled={loading}
              onTranscript={(t) => {
                setInput(t);
                if (t.trim()) send(t);
              }}
            />
            <button type="submit" className="btn-primary shrink-0" disabled={loading}>
              Send
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}
