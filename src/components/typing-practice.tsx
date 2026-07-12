"use client";

import { useState } from "react";
import { completeTypingAction } from "@/app/actions/learning";
import type { TypingExercise } from "@/lib/exercises";

function normalizePinyin(input: string): string {
  return input.toLowerCase().replace(/\s+/g, "").trim();
}

export function TypingPractice({
  exercises,
}: {
  exercises: TypingExercise[];
}) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (exercises.length === 0) {
    return (
      <div className="card p-6 text-center text-warm-gray">
        Not enough vocabulary for typing practice yet.
      </div>
    );
  }

  if (done) {
    const correct = Object.values(results).filter(Boolean).length;
    const score = Math.round((correct / exercises.length) * 100);
    return (
      <div className="card p-6 text-center">
        <p className="text-4xl">⌨️</p>
        <p className="mt-2 text-xl font-semibold text-warm-brown">Typing done!</p>
        <p className="mt-1 text-sm text-warm-gray">
          Score: {score}% ({correct}/{exercises.length})
        </p>
        <a href="/" className="btn-primary mt-4 inline-flex">
          Back to Home
        </a>
      </div>
    );
  }

  const current = exercises[index];
  const checked = results[current.id] !== undefined;
  const isCorrect = results[current.id];

  function checkAnswer() {
    const ok =
      normalizePinyin(input) === normalizePinyin(current.pinyinNumber) ||
      normalizePinyin(input) === normalizePinyin(current.pinyin);
    setResults((prev) => ({ ...prev, [current.id]: ok }));
  }

  async function finish() {
    setSubmitting(true);
    const correct = Object.values(results).filter(Boolean).length;
    const score = Math.round((correct / exercises.length) * 100);
    await completeTypingAction(score);
    setDone(true);
    setSubmitting(false);
  }

  function goNext() {
    setInput("");
    if (index < exercises.length - 1) {
      setIndex((i) => i + 1);
    } else {
      finish();
    }
  }

  return (
    <div className="card space-y-4 p-5">
      <p className="text-xs text-warm-gray">
        Exercise {index + 1} of {exercises.length}
      </p>

      <div className="text-center">
        <p className="font-chinese text-4xl text-warm-brown">{current.chinese}</p>
        <p className="mt-2 text-sm text-warm-gray">{current.english}</p>
      </div>

      <p className="text-sm text-warm-brown">{current.hint}</p>
      <input
        className="input"
        placeholder="e.g. ni3hao3"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={checked}
      />

      {!checked ? (
        <button
          type="button"
          className="btn-primary w-full"
          disabled={!input.trim()}
          onClick={checkAnswer}
        >
          Check
        </button>
      ) : (
        <div
          className={`rounded-xl p-3 text-sm ${
            isCorrect ? "bg-success/20 text-warm-brown" : "bg-blush text-china-red"
          }`}
        >
          {isCorrect ? (
            <p>Correct! 🎉</p>
          ) : (
            <p>
              Not quite. Answer: <strong>{current.pinyinNumber}</strong> (
              {current.pinyin})
            </p>
          )}
        </div>
      )}

      {checked ? (
        <button
          type="button"
          className="btn-primary w-full"
          disabled={submitting}
          onClick={goNext}
        >
          {submitting
            ? "Saving..."
            : index < exercises.length - 1
              ? "Next"
              : "Finish"}
        </button>
      ) : null}
    </div>
  );
}
