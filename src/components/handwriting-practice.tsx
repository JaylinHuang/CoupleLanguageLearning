"use client";

import { useEffect, useRef, useState } from "react";
import type HanziWriterType from "hanzi-writer";
import { completeHandwritingAction } from "@/app/actions/learning";

type WordItem = {
  id: string;
  simplified: string;
  pinyin: string;
  english: string;
};

export function HandwritingPractice({
  words,
  initialChar,
}: {
  words: WordItem[];
  initialChar?: string;
}) {
  const initialWord =
    words.find((w) => w.simplified === initialChar) ?? words[0] ?? null;
  const [word, setWord] = useState<WordItem | null>(initialWord);
  const [mode, setMode] = useState<"watch" | "practice">("watch");
  const [completedChars, setCompletedChars] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const writersRef = useRef<HanziWriterType[]>([]);

  // 只取汉字字符（过滤标点等）
  const chars = word
    ? [...word.simplified].filter((c) => /[\u4e00-\u9fff]/.test(c))
    : [];

  useEffect(() => {
    let cancelled = false;
    setCompletedChars(0);

    async function setup() {
      const container = containerRef.current;
      if (!container || chars.length === 0) return;

      // hanzi-writer 只能在浏览器端加载
      const HanziWriter = (await import("hanzi-writer")).default;
      if (cancelled) return;

      container.innerHTML = "";
      writersRef.current = [];

      for (const char of chars) {
        const box = document.createElement("div");
        box.className =
          "rounded-2xl border border-blush bg-white p-2 shadow-sm";
        container.appendChild(box);

        const writer = HanziWriter.create(box, char, {
          width: 180,
          height: 180,
          padding: 10,
          showCharacter: mode === "watch",
          showOutline: true,
          strokeColor: "#b5654d",
          outlineColor: "#f3d9d3",
          drawingColor: "#e07856",
          drawingWidth: 18,
        });
        writersRef.current.push(writer);

        if (mode === "watch") {
          writer.loopCharacterAnimation();
        } else {
          writer.quiz({
            onComplete: () => {
              if (!cancelled) setCompletedChars((n) => n + 1);
            },
          });
        }
      }
    }

    setup();
    return () => {
      cancelled = true;
      writersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word?.id, mode]);

  // 练习模式下写完全部字 → 发 XP（每个词一次）
  useEffect(() => {
    if (
      mode === "practice" &&
      chars.length > 0 &&
      completedChars >= chars.length &&
      !xpAwarded
    ) {
      setXpAwarded(true);
      completeHandwritingAction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedChars]);

  if (!word) {
    return (
      <div className="card p-6 text-center text-warm-gray">
        No words to practice yet. Complete a lesson first!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {words.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => {
              setWord(w);
              setXpAwarded(false);
            }}
            className={`badge whitespace-nowrap font-chinese ${
              word.id === w.id ? "bg-coral text-white" : ""
            }`}
          >
            {w.simplified}
          </button>
        ))}
      </div>

      <div className="card space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-chinese text-2xl text-warm-brown">
              {word.simplified}
            </p>
            <p className="text-sm text-coral-dark">{word.pinyin}</p>
            <p className="text-xs text-warm-gray">{word.english}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className={mode === "watch" ? "btn-primary" : "btn-secondary"}
              onClick={() => setMode("watch")}
            >
              ▶ Watch
            </button>
            <button
              type="button"
              className={mode === "practice" ? "btn-primary" : "btn-secondary"}
              onClick={() => {
                setMode("practice");
                setCompletedChars(0);
              }}
            >
              ✍️ Practice
            </button>
          </div>
        </div>

        {mode === "practice" ? (
          <p className="text-xs text-warm-gray">
            Draw each stroke in order with your finger or mouse.{" "}
            {completedChars >= chars.length && chars.length > 0
              ? `All done! 🎉 ${xpAwarded ? "+10 XP" : ""}`
              : `${completedChars}/${chars.length} characters done`}
          </p>
        ) : (
          <p className="text-xs text-warm-gray">
            Watch the stroke order animation, then switch to Practice.
          </p>
        )}

        <div ref={containerRef} className="flex flex-wrap gap-4" />
      </div>
    </div>
  );
}
