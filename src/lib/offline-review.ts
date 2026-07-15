"use client";

// 离线复习：评分先缓存到 localStorage，联网后同步到服务器

export type PendingReview = {
  cardId: string;
  quality: number;
  ratedAt: number;
};

const QUEUE_KEY = "offline-review-queue";

export function getQueue(): PendingReview[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as PendingReview[];
  } catch {
    return [];
  }
}

export function pushToQueue(item: PendingReview) {
  const queue = getQueue();
  queue.push(item);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

// 把离线期间的评分同步到服务器；成功后清空队列
export async function syncQueue(): Promise<number> {
  const queue = getQueue();
  if (queue.length === 0) return 0;

  try {
    const res = await fetch("/api/review/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: queue }),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    clearQueue();
    return data.applied ?? queue.length;
  } catch {
    // 仍然离线，下次再试
    return 0;
  }
}
