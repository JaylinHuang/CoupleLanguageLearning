"use client";

import { useState } from "react";
import {
  reviewWordAction,
  finishReviewSessionAction,
} from "@/app/actions/learning";

type ReviewItem = {
  id: string;
  markedHard: boolean;
  word: {
    id: string;
    simplified: string;
    pinyin: string;
    pinyinNumber: string;
    english: string;
  };
};

export function ReviewSession({ cards }: { cards: ReviewItem[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [remaining] = useState(cards);

  if (cards.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-lg font-medium text-warm-brown">All caught up!</p>
        <p className="mt-2 text-sm text-warm-gray">
          No cards due right now. Come back tomorrow or start a lesson.
        </p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="card p-6 text-center">
        <p className="text-4xl">✨</p>
        <p className="mt-2 font-medium text-warm-brown">Review session done!</p>
        <a href="/" className="btn-primary mt-4 inline-flex">
          Back to Home
        </a>
      </div>
    );
  }

  const card = remaining[index];

  async function rate(quality: 0 | 1 | 2 | 3 | 4 | 5) {
    await reviewWordAction(card.id, quality);
    const next = index + 1;
    if (next >= remaining.length) {
      await finishReviewSessionAction();
      setFinished(true);
    } else {
      setIndex(next);
      setRevealed(false);
    }
  }

  return (
    <div className="card p-6">
      <p className="text-xs text-warm-gray">
        Card {index + 1} of {remaining.length}
        {card.markedHard ? " · marked hard" : ""}
      </p>
      <button
        type="button"
        className="mt-4 w-full text-left"
        onClick={() => setRevealed(true)}
      >
        <p className="font-chinese text-5xl text-warm-brown">
          {revealed ? card.word.simplified : "?"}
        </p>
        {revealed ? (
          <div className="mt-4 space-y-1">
            <p className="text-coral-dark">{card.word.pinyin}</p>
            <p className="text-xs text-warm-gray">{card.word.pinyinNumber}</p>
            <p className="text-sm">{card.word.english}</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-warm-gray">Tap to reveal</p>
        )}
      </button>

      {revealed ? (
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button type="button" className="btn-secondary" onClick={() => rate(1)}>
            Again
          </button>
          <button type="button" className="btn-secondary" onClick={() => rate(3)}>
            Hard
          </button>
          <button type="button" className="btn-secondary" onClick={() => rate(4)}>
            Good
          </button>
          <button type="button" className="btn-primary" onClick={() => rate(5)}>
            Easy
          </button>
        </div>
      ) : null}
    </div>
  );
}
