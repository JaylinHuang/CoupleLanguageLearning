"use client";

import { useState } from "react";
import { completeDictationAction } from "@/app/actions/learning";
import { SpeakButton } from "@/components/speak-button";
import { checkDictationAnswer, type DictationExercise } from "@/lib/exercises";

type Result = { input: string; correct: boolean };

export function DictationPractice({
  exercises,
}: {
  exercises: DictationExercise[];
}) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState<boolean | null>(null);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (exercises.length === 0) {
    return (
      <div className="card p-6 text-center text-warm-gray">
        Not enough vocabulary yet. Complete a lesson first!
      </div>
    );
  }

  const current = exercises[index];
  const correctCount = Object.values(results).filter((r) => r.correct).length;

  function check() {
    const correct = checkDictationAnswer(input, current);
    setChecked(correct);
    setResults((prev) => ({
      ...prev,
      [current.id]: { input: input.trim(), correct },
    }));
  }

  async function next() {
    if (index < exercises.length - 1) {
      setIndex((i) => i + 1);
      setInput("");
      setChecked(null);
    } else {
      setSubmitting(true);
      const score = Math.round((correctCount / exercises.length) * 100);
      await completeDictationAction(score);
      setDone(true);
      setSubmitting(false);
    }
  }

  if (done) {
    const score = Math.round((correctCount / exercises.length) * 100);
    return (
      <div className="card p-6 text-center">
        <p className="text-4xl">✍️</p>
        <p className="mt-2 text-xl font-semibold text-warm-brown">
          Dictation complete!
        </p>
        <p className="mt-1 text-sm text-warm-gray">
          Score: {score}% ({correctCount}/{exercises.length}) · +10 XP
        </p>
        <div className="mt-4 space-y-2 text-left">
          {exercises.map((e) => {
            const r = results[e.id];
            return (
              <div
                key={e.id}
                className={`rounded-xl border p-3 text-sm ${
                  r?.correct
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <span className="font-chinese text-lg">{e.chinese}</span>{" "}
                <span className="text-coral-dark">{e.pinyin}</span>{" "}
                <span className="text-warm-gray">— {e.english}</span>
                {!r?.correct ? (
                  <p className="mt-1 text-xs text-red-600">
                    You wrote: {r?.input || "(empty)"}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
        <a href="/" className="btn-primary mt-4 inline-flex">
          Back to Home
        </a>
      </div>
    );
  }

  return (
    <div className="card space-y-4 p-5">
      <p className="text-xs text-warm-gray">
        Word {index + 1} of {exercises.length}
      </p>

      <div className="flex items-center gap-3">
        <SpeakButton text={current.chinese} label="🔊 Listen" className="btn-primary" />
        <span className="text-xs text-warm-gray">
          Hint: {current.english}
        </span>
      </div>

      <input
        className="input font-chinese"
        placeholder="Type hanzi (你好) or pinyin (ni3hao3)"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setChecked(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && input.trim() && checked === null) check();
        }}
      />

      {checked !== null ? (
        <div
          className={`rounded-xl border p-3 text-sm ${
            checked
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {checked ? "Correct! 🎉" : "Not quite."}{" "}
          <span className="font-chinese">{current.chinese}</span> ·{" "}
          {current.pinyin} ({current.pinyinNumber})
        </div>
      ) : null}

      <div className="flex justify-end gap-3">
        {checked === null ? (
          <button
            type="button"
            className="btn-primary"
            disabled={!input.trim()}
            onClick={check}
          >
            Check
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            disabled={submitting}
            onClick={next}
          >
            {submitting
              ? "Saving..."
              : index < exercises.length - 1
                ? "Next"
                : "Finish"}
          </button>
        )}
      </div>
    </div>
  );
}
