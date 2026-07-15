"use client";

import { useState } from "react";
import {
  updateLessonContentAction,
  updateLessonMetaAction,
} from "@/app/actions/learning";
import type { LessonContent } from "@/lib/types";

type Meta = {
  title: string;
  description: string;
  hskLevel: number;
  sceneTag: string;
  published: boolean;
};

const emptySentence = () => ({
  chinese: "",
  pinyin: "",
  pinyinNumber: "",
  english: "",
});

const emptyTyping = () => ({
  hint: "",
  answer: "",
  pinyinNumber: "",
});

const emptyQuiz = (): LessonContent["quiz"][number] => ({
  type: "listen_choice",
  prompt: "",
  audioText: "",
  options: ["", "", "", ""],
  answer: "",
});

export function LessonEditor({
  lessonId,
  initialMeta,
  initialContent,
}: {
  lessonId: string;
  initialMeta: Meta;
  initialContent: LessonContent;
}) {
  const [meta, setMeta] = useState(initialMeta);
  const [content, setContent] = useState<LessonContent>({
    intro: initialContent.intro ?? "",
    sentences: initialContent.sentences ?? [],
    typingPrompts: initialContent.typingPrompts ?? [],
    quiz: (initialContent.quiz ?? []).map((q) => ({
      ...q,
      options: q.options?.length ? q.options : ["", "", "", ""],
    })),
  });
  const [tab, setTab] = useState<"meta" | "intro" | "sentences" | "typing" | "quiz">(
    "intro",
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      // 规范化测验：选择题去掉空选项；填空去掉 options
      const cleaned: LessonContent = {
        intro: content.intro.trim(),
        sentences: content.sentences.filter((s) => s.chinese.trim()),
        typingPrompts: content.typingPrompts.filter(
          (t) => t.answer.trim() || t.hint.trim(),
        ),
        quiz: content.quiz
          .filter((q) => q.prompt.trim() && q.answer.trim())
          .map((q) => {
            if (q.type === "fill_blank") {
              return {
                type: "fill_blank" as const,
                prompt: q.prompt.trim(),
                audioText: q.audioText?.trim() || undefined,
                answer: q.answer.trim(),
              };
            }
            const options = (q.options ?? [])
              .map((o) => o.trim())
              .filter(Boolean);
            return {
              type: "listen_choice" as const,
              prompt: q.prompt.trim(),
              audioText: q.audioText?.trim() || undefined,
              options,
              answer: q.answer.trim(),
            };
          }),
      };

      await updateLessonMetaAction(lessonId, meta);
      await updateLessonContentAction(lessonId, cleaned);
      setContent(cleaned);
      setMessage("Saved ✓");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: "meta" as const, label: "Settings" },
    { id: "intro" as const, label: "Intro" },
    { id: "sentences" as const, label: "Sentences" },
    { id: "typing" as const, label: "Typing" },
    { id: "quiz" as const, label: "Quiz" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`badge ${tab === t.id ? "bg-coral text-white" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "meta" ? (
        <div className="card space-y-3 p-4">
          <input
            className="input"
            value={meta.title}
            onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            placeholder="Title"
          />
          <textarea
            className="input min-h-20"
            value={meta.description}
            onChange={(e) => setMeta({ ...meta, description: e.target.value })}
            placeholder="Description"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="number"
              className="input"
              value={meta.hskLevel}
              onChange={(e) =>
                setMeta({ ...meta, hskLevel: Number(e.target.value) || 1 })
              }
              placeholder="HSK level"
            />
            <input
              className="input"
              value={meta.sceneTag}
              onChange={(e) => setMeta({ ...meta, sceneTag: e.target.value })}
              placeholder="Scene tag (e.g. couple)"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={meta.published}
              onChange={(e) =>
                setMeta({ ...meta, published: e.target.checked })
              }
            />
            Published (visible to Erika)
          </label>
        </div>
      ) : null}

      {tab === "intro" ? (
        <div className="card space-y-3 p-4">
          <p className="text-sm text-warm-gray">
            Opening text shown in the Intro step.
          </p>
          <textarea
            className="input min-h-40"
            value={content.intro}
            onChange={(e) => setContent({ ...content, intro: e.target.value })}
            placeholder="Lesson introduction..."
          />
        </div>
      ) : null}

      {tab === "sentences" ? (
        <div className="space-y-3">
          {content.sentences.map((s, i) => (
            <div key={i} className="card space-y-2 p-4">
              <div className="flex justify-between">
                <p className="text-xs text-warm-gray">Sentence {i + 1}</p>
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() =>
                    setContent({
                      ...content,
                      sentences: content.sentences.filter((_, j) => j !== i),
                    })
                  }
                >
                  Remove
                </button>
              </div>
              <input
                className="input font-chinese"
                placeholder="中文"
                value={s.chinese}
                onChange={(e) => {
                  const sentences = [...content.sentences];
                  sentences[i] = { ...s, chinese: e.target.value };
                  setContent({ ...content, sentences });
                }}
              />
              <input
                className="input"
                placeholder="Pinyin (nǐ hǎo)"
                value={s.pinyin}
                onChange={(e) => {
                  const sentences = [...content.sentences];
                  sentences[i] = { ...s, pinyin: e.target.value };
                  setContent({ ...content, sentences });
                }}
              />
              <input
                className="input"
                placeholder="Pinyin numbers (ni3hao3)"
                value={s.pinyinNumber}
                onChange={(e) => {
                  const sentences = [...content.sentences];
                  sentences[i] = { ...s, pinyinNumber: e.target.value };
                  setContent({ ...content, sentences });
                }}
              />
              <input
                className="input"
                placeholder="English"
                value={s.english}
                onChange={(e) => {
                  const sentences = [...content.sentences];
                  sentences[i] = { ...s, english: e.target.value };
                  setContent({ ...content, sentences });
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              setContent({
                ...content,
                sentences: [...content.sentences, emptySentence()],
              })
            }
          >
            + Add sentence
          </button>
        </div>
      ) : null}

      {tab === "typing" ? (
        <div className="space-y-3">
          {content.typingPrompts.map((t, i) => (
            <div key={i} className="card space-y-2 p-4">
              <div className="flex justify-between">
                <p className="text-xs text-warm-gray">Prompt {i + 1}</p>
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() =>
                    setContent({
                      ...content,
                      typingPrompts: content.typingPrompts.filter(
                        (_, j) => j !== i,
                      ),
                    })
                  }
                >
                  Remove
                </button>
              </div>
              <input
                className="input"
                placeholder="Hint (e.g. Type “hello”)"
                value={t.hint}
                onChange={(e) => {
                  const typingPrompts = [...content.typingPrompts];
                  typingPrompts[i] = { ...t, hint: e.target.value };
                  setContent({ ...content, typingPrompts });
                }}
              />
              <input
                className="input font-chinese"
                placeholder="Answer (你好)"
                value={t.answer}
                onChange={(e) => {
                  const typingPrompts = [...content.typingPrompts];
                  typingPrompts[i] = { ...t, answer: e.target.value };
                  setContent({ ...content, typingPrompts });
                }}
              />
              <input
                className="input"
                placeholder="Pinyin numbers (ni3hao3)"
                value={t.pinyinNumber}
                onChange={(e) => {
                  const typingPrompts = [...content.typingPrompts];
                  typingPrompts[i] = { ...t, pinyinNumber: e.target.value };
                  setContent({ ...content, typingPrompts });
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              setContent({
                ...content,
                typingPrompts: [...content.typingPrompts, emptyTyping()],
              })
            }
          >
            + Add typing prompt
          </button>
        </div>
      ) : null}

      {tab === "quiz" ? (
        <div className="space-y-3">
          {content.quiz.map((q, i) => (
            <div key={i} className="card space-y-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-warm-gray">Question {i + 1}</p>
                <div className="flex gap-2">
                  <select
                    className="input w-auto py-1 text-xs"
                    value={q.type}
                    onChange={(e) => {
                      const quiz = [...content.quiz];
                      quiz[i] = {
                        ...q,
                        type: e.target.value as "listen_choice" | "fill_blank",
                      };
                      setContent({ ...content, quiz });
                    }}
                  >
                    <option value="listen_choice">Multiple choice</option>
                    <option value="fill_blank">Fill blank</option>
                  </select>
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() =>
                      setContent({
                        ...content,
                        quiz: content.quiz.filter((_, j) => j !== i),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
              <input
                className="input"
                placeholder="Prompt / question"
                value={q.prompt}
                onChange={(e) => {
                  const quiz = [...content.quiz];
                  quiz[i] = { ...q, prompt: e.target.value };
                  setContent({ ...content, quiz });
                }}
              />
              <input
                className="input font-chinese"
                placeholder="Audio text (optional 中文)"
                value={q.audioText ?? ""}
                onChange={(e) => {
                  const quiz = [...content.quiz];
                  quiz[i] = { ...q, audioText: e.target.value };
                  setContent({ ...content, quiz });
                }}
              />
              {q.type === "listen_choice" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {(q.options ?? ["", "", "", ""]).map((opt, oi) => (
                    <input
                      key={oi}
                      className="input"
                      placeholder={`Option ${oi + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const options = [...(q.options ?? ["", "", "", ""])];
                        options[oi] = e.target.value;
                        const quiz = [...content.quiz];
                        quiz[i] = { ...q, options };
                        setContent({ ...content, quiz });
                      }}
                    />
                  ))}
                </div>
              ) : null}
              <input
                className="input"
                placeholder="Correct answer (must match an option for choice)"
                value={q.answer}
                onChange={(e) => {
                  const quiz = [...content.quiz];
                  quiz[i] = { ...q, answer: e.target.value };
                  setContent({ ...content, quiz });
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              setContent({
                ...content,
                quiz: [...content.quiz, emptyQuiz()],
              })
            }
          >
            + Add quiz question
          </button>
        </div>
      ) : null}

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-blush bg-cream/95 p-3 shadow-md backdrop-blur">
        <button
          type="button"
          className="btn-primary"
          disabled={saving || !meta.title.trim()}
          onClick={save}
        >
          {saving ? "Saving..." : "Save lesson"}
        </button>
        {message ? (
          <span className="text-sm text-success">{message}</span>
        ) : null}
        {error ? (
          <span className="text-sm text-china-red">{error}</span>
        ) : null}
        <a href="/admin/lessons" className="btn-secondary text-xs">
          ← Back to list
        </a>
      </div>
    </div>
  );
}
