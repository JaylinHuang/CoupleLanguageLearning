"use client";

import { useMemo, useState } from "react";
import { completeLessonAction } from "@/app/actions/learning";
import type { LessonContent } from "@/lib/types";

type WordItem = {
  id: string;
  simplified: string;
  pinyin: string;
  pinyinNumber: string;
  english: string;
  tagalogShort: string | null;
};

export function LessonPlayer({
  lessonId,
  title,
  content,
  words,
}: {
  lessonId: string;
  title: string;
  content: LessonContent;
  words: WordItem[];
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  // 已点过 Check 的题，用于即时反馈
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [quizIndex, setQuizIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const steps = useMemo(() => {
    const list: Array<{ type: string; label: string }> = [
      { type: "intro", label: "Intro" },
      { type: "words", label: "Words" },
      { type: "sentences", label: "Sentences" },
      { type: "typing", label: "Typing" },
      { type: "quiz", label: "Quiz" },
    ];
    return list;
  }, []);

  const current = steps[step];
  const quiz = content.quiz;
  const currentQuiz = quiz[quizIndex];

  function buildDetails() {
    return quiz.map((q, i) => {
      const userAnswer = (answers[i] ?? "").trim();
      return {
        prompt: q.prompt,
        audioText: q.audioText,
        correctAnswer: q.answer,
        userAnswer,
        isCorrect: userAnswer === q.answer,
      };
    });
  }

  async function handleComplete() {
    setSubmitting(true);
    const details = buildDetails();
    const correct = details.filter((d) => d.isCorrect).length;
    const score =
      quiz.length > 0 ? Math.round((correct / quiz.length) * 100) : 100;
    await completeLessonAction(lessonId, score, details);
    setDone(true);
    setSubmitting(false);
  }

  function checkCurrentQuiz() {
    if (!currentQuiz) return;
    setChecked((prev) => ({ ...prev, [quizIndex]: true }));
  }

  function nextQuizOrFinish() {
    if (quizIndex < quiz.length - 1) {
      setQuizIndex((i) => i + 1);
    } else {
      handleComplete();
    }
  }

  if (done) {
    const details = buildDetails();
    const wrong = details.filter((d) => !d.isCorrect);
    const correct = details.length - wrong.length;
    const score =
      details.length > 0
        ? Math.round((correct / details.length) * 100)
        : 100;

    return (
      <div className="card space-y-4 p-6 text-center">
        <p className="text-4xl">🎉</p>
        <h2 className="text-xl font-semibold text-warm-brown">
          Lesson complete!
        </h2>
        <p className="text-sm text-warm-gray">
          Score {score}% · {correct}/{details.length || 0} correct
        </p>
        <p className="text-sm text-warm-gray">
          Great job, Erika. Lin is proud of you.
        </p>
        {wrong.length > 0 ? (
          <a href="/mistakes" className="btn-secondary inline-flex">
            Review my mistakes ({wrong.length})
          </a>
        ) : null}
        <div>
          <a href="/" className="btn-primary inline-flex">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <button
            key={s.type}
            type="button"
            onClick={() => setStep(i)}
            className={`badge ${i === step ? "bg-coral text-white" : ""}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="card p-5">
        {current.type === "intro" && (
          <div>
            <h2 className="text-lg font-medium text-warm-brown">{title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-warm-gray">
              {content.intro}
            </p>
          </div>
        )}

        {current.type === "words" && (
          <div className="space-y-3">
            {words.map((w) => (
              <div
                key={w.id}
                className="rounded-xl border border-blush/50 bg-blush/20 p-3"
              >
                <p className="font-chinese text-2xl text-warm-brown">
                  {w.simplified}
                </p>
                <p className="text-sm text-coral-dark">{w.pinyin}</p>
                <p className="text-xs text-warm-gray">{w.pinyinNumber}</p>
                <p className="mt-1 text-sm">{w.english}</p>
                {w.tagalogShort ? (
                  <p className="text-xs text-warm-gray">{w.tagalogShort}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {current.type === "sentences" && (
          <div className="space-y-4">
            {content.sentences.map((s) => (
              <div key={s.chinese} className="border-b border-blush/40 pb-4">
                <p className="font-chinese text-2xl">{s.chinese}</p>
                <p className="text-sm text-coral-dark">{s.pinyin}</p>
                <p className="text-xs text-warm-gray">{s.pinyinNumber}</p>
                <p className="mt-1 text-sm text-warm-brown">{s.english}</p>
              </div>
            ))}
          </div>
        )}

        {current.type === "typing" && (
          <div className="space-y-4">
            <p className="text-sm text-warm-gray">
              Type using pinyin with number tones (e.g. ni3hao3).
            </p>
            {content.typingPrompts.map((t) => (
              <div key={t.hint}>
                <p className="text-sm font-medium">{t.hint}</p>
                <input
                  className="input mt-2"
                  placeholder={t.pinyinNumber}
                  aria-label={t.hint}
                />
                <p className="mt-1 text-xs text-warm-gray">
                  Answer: {t.answer} ({t.pinyinNumber})
                </p>
              </div>
            ))}
          </div>
        )}

        {current.type === "quiz" && (
          <div className="space-y-4">
            {quiz.length === 0 ? (
              <p className="text-sm text-warm-gray">
                No quiz questions in this lesson.
              </p>
            ) : currentQuiz ? (
              <>
                <p className="text-xs text-warm-gray">
                  Question {quizIndex + 1} of {quiz.length}
                </p>
                <p className="font-medium text-warm-brown">
                  {currentQuiz.prompt}
                </p>
                {currentQuiz.audioText ? (
                  <p className="font-chinese text-xl text-coral-dark">
                    🔊 {currentQuiz.audioText}
                  </p>
                ) : null}

                {currentQuiz.options ? (
                  <div className="grid gap-2">
                    {currentQuiz.options.map((opt) => {
                      const selected = answers[quizIndex] === opt;
                      const isChecked = checked[quizIndex];
                      const isRight = opt === currentQuiz.answer;
                      let style =
                        "rounded-xl border px-3 py-2 text-left text-sm border-blush bg-white";
                      if (isChecked && isRight) {
                        style =
                          "rounded-xl border px-3 py-2 text-left text-sm border-green-400 bg-green-50";
                      } else if (isChecked && selected && !isRight) {
                        style =
                          "rounded-xl border px-3 py-2 text-left text-sm border-red-400 bg-red-50";
                      } else if (selected) {
                        style =
                          "rounded-xl border px-3 py-2 text-left text-sm border-coral bg-blush";
                      }
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={!!checked[quizIndex]}
                          onClick={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [quizIndex]: opt,
                            }))
                          }
                          className={style}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    className="input"
                    value={answers[quizIndex] ?? ""}
                    disabled={!!checked[quizIndex]}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [quizIndex]: e.target.value,
                      }))
                    }
                    placeholder="Type your answer"
                  />
                )}

                {checked[quizIndex] ? (
                  <div
                    className={`rounded-xl border p-3 text-sm ${
                      (answers[quizIndex] ?? "").trim() === currentQuiz.answer
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-600"
                    }`}
                  >
                    {(answers[quizIndex] ?? "").trim() === currentQuiz.answer
                      ? "Correct! ✓"
                      : `Not quite. Correct answer: ${currentQuiz.answer}`}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3">
        <button
          type="button"
          className="btn-secondary"
          disabled={
            step === 0 ||
            (current.type === "quiz" && quizIndex === 0 && !checked[0])
          }
          onClick={() => {
            if (current.type === "quiz" && quizIndex > 0) {
              setQuizIndex((i) => i - 1);
            } else {
              setStep((s) => Math.max(0, s - 1));
            }
          }}
        >
          Previous
        </button>

        {current.type === "quiz" && quiz.length > 0 ? (
          !checked[quizIndex] ? (
            <button
              type="button"
              className="btn-primary"
              disabled={!(answers[quizIndex] ?? "").trim()}
              onClick={checkCurrentQuiz}
            >
              Check
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              disabled={submitting}
              onClick={nextQuizOrFinish}
            >
              {submitting
                ? "Saving..."
                : quizIndex < quiz.length - 1
                  ? "Next question"
                  : "Complete Lesson"}
            </button>
          )
        ) : step < steps.length - 1 ? (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setStep((s) => s + 1)}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            disabled={submitting}
            onClick={handleComplete}
          >
            {submitting ? "Saving..." : "Complete Lesson"}
          </button>
        )}
      </div>
    </div>
  );
}
