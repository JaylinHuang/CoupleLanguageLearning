"use client";

import { useState } from "react";
import { VoiceInputButton } from "@/components/voice-input";

type CheckResult = {
  corrected: string;
  errors: Array<{ original: string; fixed: string; explanation: string }>;
  praise: string;
};

type HistoryItem = { input: string; result: CheckResult };

const PROMPTS = [
  "Write about your day 今天",
  "Tell Lin what you ate 吃",
  "Say what you want to do 想",
];

export function WritingCheck() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/grammar-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Check failed");
      }
      const result = (await res.json()) as CheckResult;
      setHistory((prev) => [{ input: trimmed, result }, ...prev]);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-5">
        <p className="text-sm text-warm-gray">
          Write 1-2 sentences in Chinese. The AI teacher will check them and
          Lin can see your practice too. +10 XP each check!
        </p>
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <span key={p} className="badge">
              💡 {p}
            </span>
          ))}
        </div>
        <textarea
          className="input font-chinese min-h-24 text-lg"
          placeholder="我今天很开心..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-primary"
            disabled={!text.trim() || loading}
            onClick={submit}
          >
            {loading ? "Checking..." : "Check my Chinese"}
          </button>
          <VoiceInputButton
            disabled={loading}
            onTranscript={(t) => setText((prev) => (prev + " " + t).trim())}
          />
        </div>
        {error ? <p className="text-sm text-china-red">{error}</p> : null}
      </div>

      {history.map((item, idx) => (
        <div key={idx} className="card space-y-3 p-5">
          <div>
            <p className="text-xs text-warm-gray">You wrote:</p>
            <p className="font-chinese text-lg">{item.input}</p>
          </div>

          {item.result.errors.length === 0 ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              Perfect! No errors found. 🎉
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs text-warm-gray">Corrected:</p>
                <p className="font-chinese text-lg text-green-700">
                  {item.result.corrected}
                </p>
              </div>
              <div className="space-y-2">
                {item.result.errors.map((e, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm"
                  >
                    <p>
                      <span className="font-chinese text-red-600 line-through">
                        {e.original}
                      </span>{" "}
                      → <span className="font-chinese text-green-700">{e.fixed}</span>
                    </p>
                    <p className="mt-1 text-xs text-warm-gray">{e.explanation}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="text-sm text-coral-dark">💕 {item.result.praise}</p>
        </div>
      ))}
    </div>
  );
}
