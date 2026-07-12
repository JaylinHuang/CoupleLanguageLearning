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

  async function handleComplete() {
    setSubmitting(true);
    const quiz = content.quiz;
    let correct = 0;
    quiz.forEach((q, i) => {
      if ((answers[i] ?? "").trim() === q.answer) correct += 1;
    });
    const score =
      quiz.length > 0 ? Math.round((correct / quiz.length) * 100) : 100;
    await completeLessonAction(lessonId, score);
    setDone(true);
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="card p-6 text-center">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-3 text-xl font-semibold text-warm-brown">
          Lesson complete!
        </h2>
        <p className="mt-2 text-sm text-warm-gray">
          Great job, Erika. Lin is proud of you.
        </p>
        <a href="/" className="btn-primary mt-4 inline-flex">
          Back to Home
        </a>
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
            {content.quiz.map((q, i) => (
              <div key={`${q.prompt}-${i}`} className="space-y-2">
                <p className="font-medium text-warm-brown">{q.prompt}</p>
                {q.audioText ? (
                  <p className="font-chinese text-xl text-coral-dark">
                    🔊 {q.audioText}
                  </p>
                ) : null}
                {q.options ? (
                  <div className="grid gap-2">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [i]: opt }))
                        }
                        className={`rounded-xl border px-3 py-2 text-left text-sm ${
                          answers[i] === opt
                            ? "border-coral bg-blush"
                            : "border-blush bg-white"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    className="input"
                    value={answers[i] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
                    }
                    placeholder="Type your answer"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3">
        <button
          type="button"
          className="btn-secondary"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Previous
        </button>
        {step < steps.length - 1 ? (
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
