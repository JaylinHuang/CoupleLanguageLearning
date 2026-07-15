"use client";

import { useState } from "react";
import { completeSmartQuizAction } from "@/app/actions/learning";

type Question = {
  type: "choice" | "fill_blank";
  prompt: string;
  options?: string[];
  answer: string;
  explanation: string;
};

export function SmartQuiz() {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [source, setSource] = useState<string>("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [graded, setGraded] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    setGraded(false);
    setAnswers({});
    try {
      const res = await fetch("/api/smart-quiz", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate quiz");
      const data = await res.json();
      setQuestions(data.questions);
      setSource(data.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function isCorrect(q: Question, i: number): boolean {
    const given = (answers[i] ?? "").trim().toLowerCase();
    return given === q.answer.trim().toLowerCase();
  }

  async function grade() {
    if (!questions) return;
    setGraded(true);
    const correct = questions.filter((q, i) => isCorrect(q, i)).length;
    const score = Math.round((correct / questions.length) * 100);
    await completeSmartQuizAction(score);
  }

  if (!questions) {
    return (
      <div className="card p-6 text-center">
        <p className="text-4xl">🧠</p>
        <p className="mt-3 text-sm text-warm-gray">
          The AI teacher creates new questions from your recent mistakes and
          hard words — so you practice exactly what you need.
        </p>
        <button
          type="button"
          className="btn-primary mt-4"
          disabled={loading}
          onClick={generate}
        >
          {loading ? "Creating questions..." : "Generate my practice"}
        </button>
        {error ? <p className="mt-2 text-sm text-china-red">{error}</p> : null}
      </div>
    );
  }

  const correctCount = questions.filter((q, i) => isCorrect(q, i)).length;
  const allAnswered = questions.every((_, i) => (answers[i] ?? "").trim());

  return (
    <div className="space-y-4">
      {source === "fallback" ? (
        <p className="text-center text-xs text-warm-gray">
          Practice from your hard words
        </p>
      ) : null}

      {questions.map((q, i) => {
        const given = answers[i] ?? "";
        const correct = graded && isCorrect(q, i);
        const wrong = graded && !isCorrect(q, i);
        return (
          <div
            key={i}
            className={`card space-y-2 p-4 ${
              correct ? "border-green-300" : wrong ? "border-red-300" : ""
            }`}
          >
            <p className="font-medium text-warm-brown">
              {i + 1}. {q.prompt}
            </p>
            {q.type === "choice" && q.options ? (
              <div className="grid gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    disabled={graded}
                    onClick={() => setAnswers((p) => ({ ...p, [i]: opt }))}
                    className={`rounded-xl border px-3 py-2 text-left text-sm ${
                      given === opt
                        ? "border-coral bg-blush"
                        : "border-blush bg-white"
                    } ${graded && opt === q.answer ? "border-green-400 bg-green-50" : ""}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <input
                className="input font-chinese"
                placeholder="Type your answer"
                value={given}
                disabled={graded}
                onChange={(e) => setAnswers((p) => ({ ...p, [i]: e.target.value }))}
              />
            )}
            {graded ? (
              <div
                className={`rounded-xl p-3 text-sm ${
                  correct ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`}
              >
                {correct ? "Correct! ✓" : `Answer: ${q.answer}`}
                <p className="mt-1 text-xs text-warm-gray">{q.explanation}</p>
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="flex justify-center gap-3">
        {!graded ? (
          <button
            type="button"
            className="btn-primary"
            disabled={!allAnswered}
            onClick={grade}
          >
            Check answers
          </button>
        ) : (
          <>
            <p className="self-center text-sm font-medium text-warm-brown">
              {correctCount}/{questions.length} correct · +15 XP
            </p>
            <button type="button" className="btn-secondary" onClick={generate}>
              New practice
            </button>
          </>
        )}
      </div>
    </div>
  );
}
