"use client";

import { useState } from "react";
import type { QuizAnswerDetail } from "@/lib/types";

// 单条答题记录（已序列化，供客户端组件使用）
export type AttemptItem = {
  id: string;
  lessonTitle: string;
  score: number;
  completedAt: string;
  answers: QuizAnswerDetail[];
};

// 旧记录：只有 LessonProgress、没有逐题详情的课程
export type LegacyProgressItem = {
  id: string;
  lessonTitle: string;
  status: string;
  score: number | null;
};

export function LessonAttemptHistory({
  attempts,
  legacy,
}: {
  attempts: AttemptItem[];
  legacy: LegacyProgressItem[];
}) {
  const [selected, setSelected] = useState<AttemptItem | null>(null);

  return (
    <>
      <div className="space-y-2">
        {attempts.length === 0 && legacy.length === 0 ? (
          <p className="text-sm text-warm-gray">No lessons completed yet.</p>
        ) : null}

        {attempts.map((a) => {
          const wrongCount = a.answers.filter((ans) => !ans.isCorrect).length;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelected(a)}
              className="card flex w-full items-center justify-between p-3 text-left text-sm transition hover:border-coral hover:shadow-md"
            >
              <span>
                <span className="font-medium">{a.lessonTitle}</span>
                <span className="ml-2 text-xs text-warm-gray">
                  {new Date(a.completedAt).toLocaleString()}
                </span>
              </span>
              <span className="flex items-center gap-2">
                {wrongCount > 0 ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                    {wrongCount} wrong
                  </span>
                ) : a.answers.length > 0 ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    All correct
                  </span>
                ) : null}
                <span className="text-warm-gray">{a.score}%</span>
              </span>
            </button>
          );
        })}

        {legacy.map((lp) => (
          <div
            key={lp.id}
            className="card flex justify-between p-3 text-sm opacity-70"
            title="Older record — no per-question details"
          >
            <span>{lp.lessonTitle}</span>
            <span className="text-warm-gray">
              {lp.status}
              {lp.score != null ? ` · ${lp.score}%` : ""} · no details
            </span>
          </div>
        ))}
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-warm-brown">
                  {selected.lessonTitle}
                </h3>
                <p className="text-xs text-warm-gray">
                  {new Date(selected.completedAt).toLocaleString()} · Score{" "}
                  {selected.score}%
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary px-3 py-1 text-sm"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>

            {selected.answers.length === 0 ? (
              <p className="text-sm text-warm-gray">
                This lesson has no quiz questions.
              </p>
            ) : (
              <div className="space-y-3">
                {selected.answers.map((ans, i) => (
                  <div
                    key={`${ans.prompt}-${i}`}
                    className={`rounded-xl border p-3 text-sm ${
                      ans.isCorrect
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <p className="font-medium text-warm-brown">
                      {i + 1}. {ans.prompt}
                    </p>
                    {ans.audioText ? (
                      <p className="font-chinese mt-1 text-lg text-coral-dark">
                        🔊 {ans.audioText}
                      </p>
                    ) : null}
                    <div className="mt-2 grid gap-1">
                      <p>
                        <span className="text-xs text-warm-gray">
                          Her answer:{" "}
                        </span>
                        <span
                          className={
                            ans.isCorrect
                              ? "font-medium text-green-700"
                              : "font-medium text-red-600"
                          }
                        >
                          {ans.userAnswer || "(no answer)"}
                        </span>
                        <span className="ml-1">
                          {ans.isCorrect ? "✓" : "✗"}
                        </span>
                      </p>
                      {!ans.isCorrect ? (
                        <p>
                          <span className="text-xs text-warm-gray">
                            Correct answer:{" "}
                          </span>
                          <span className="font-medium text-green-700">
                            {ans.correctAnswer}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
