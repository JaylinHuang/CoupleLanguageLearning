"use client";

import { useEffect, useState } from "react";
import {
  reviewWordAction,
  finishReviewSessionAction,
} from "@/app/actions/learning";
import { pushToQueue, syncQueue, getQueue } from "@/lib/offline-review";

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
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);

  // 页面加载和网络恢复时，同步之前离线攒下的评分
  useEffect(() => {
    async function trySync() {
      const applied = await syncQueue();
      if (applied > 0) setSyncedCount(applied);
      setOfflineCount(getQueue().length);
    }
    trySync();
    window.addEventListener("online", trySync);
    return () => window.removeEventListener("online", trySync);
  }, []);

  if (cards.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-lg font-medium text-warm-brown">All caught up!</p>
        <p className="mt-2 text-sm text-warm-gray">
          No cards due right now. Come back tomorrow or start a lesson.
        </p>
        {syncedCount > 0 ? (
          <p className="mt-2 text-xs text-success">
            Synced {syncedCount} offline reviews ✓
          </p>
        ) : null}
      </div>
    );
  }

  if (finished) {
    return (
      <div className="card p-6 text-center">
        <p className="text-4xl">✨</p>
        <p className="mt-2 font-medium text-warm-brown">Review session done!</p>
        {offlineCount > 0 ? (
          <p className="mt-2 text-xs text-warm-gray">
            {offlineCount} reviews saved offline — they will sync when you are
            back online.
          </p>
        ) : null}
        <a href="/" className="btn-primary mt-4 inline-flex">
          Back to Home
        </a>
      </div>
    );
  }

  const card = remaining[index];

  async function rate(quality: 0 | 1 | 2 | 3 | 4 | 5) {
    // 离线或请求失败时，评分先存本地队列，联网后自动同步
    try {
      await reviewWordAction(card.id, quality);
    } catch {
      pushToQueue({ cardId: card.id, quality, ratedAt: Date.now() });
      setOfflineCount((n) => n + 1);
    }

    const next = index + 1;
    if (next >= remaining.length) {
      try {
        await finishReviewSessionAction();
      } catch {
        // 离线时跳过收尾 XP，评分同步时会补上每张卡的 XP
      }
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
        {offlineCount > 0 ? ` · ${offlineCount} offline` : ""}
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
