"use client";

import { useState } from "react";
import { completeListeningAction } from "@/app/actions/learning";
import { SpeakButton } from "@/components/speak-button";
import type { ListeningExercise } from "@/lib/exercises";

export function ListeningQuiz({
  exercises,
}: {
  exercises: ListeningExercise[];
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (exercises.length === 0) {
    return (
      <div className="card p-6 text-center text-warm-gray">
        Not enough vocabulary yet. Complete a lesson first!
      </div>
    );
  }

  if (done) {
    const correct = exercises.filter((e) => answers[e.id] === e.answer).length;
    const score = Math.round((correct / exercises.length) * 100);
    return (
      <div className="card p-6 text-center">
        <p className="text-4xl">🎧</p>
        <p className="mt-2 text-xl font-semibold text-warm-brown">
          Listening complete!
        </p>
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
  const selected = answers[current.id];

  async function finish() {
    setSubmitting(true);
    const correct = exercises.filter((e) => answers[e.id] === e.answer).length;
    const score = Math.round((correct / exercises.length) * 100);
    await completeListeningAction(score);
    setDone(true);
    setSubmitting(false);
  }

  return (
    <div className="card space-y-4 p-5">
      <p className="text-xs text-warm-gray">
        Question {index + 1} of {exercises.length}
      </p>
      <p className="font-medium text-warm-brown">{current.prompt}</p>

      <div className="flex items-center gap-3">
        <SpeakButton text={current.chinese} label="Listen" className="btn-primary" />
        <span className="text-xs text-warm-gray">Tap to hear Chinese</span>
      </div>

      {current.type === "fill_blank" ? (
        <input
          className="input"
          placeholder="Type one Chinese character"
          value={selected ?? ""}
          onChange={(e) =>
            setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))
          }
        />
      ) : (
        <div className="grid gap-2">
          {current.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() =>
                setAnswers((prev) => ({ ...prev, [current.id]: opt }))
              }
              className={`rounded-xl border px-3 py-2 text-left text-sm ${
                selected === opt
                  ? "border-coral bg-blush"
                  : "border-blush bg-white"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-between gap-3 pt-2">
        <button
          type="button"
          className="btn-secondary"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
        >
          Previous
        </button>
        {index < exercises.length - 1 ? (
          <button
            type="button"
            className="btn-primary"
            disabled={!selected}
            onClick={() => setIndex((i) => i + 1)}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            disabled={!selected || submitting}
            onClick={finish}
          >
            {submitting ? "Saving..." : "Finish"}
          </button>
        )}
      </div>
    </div>
  );
}
