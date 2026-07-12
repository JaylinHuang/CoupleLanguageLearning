"use client";

import { useCallback, useState } from "react";

export function useChineseTTS() {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.85;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak, speaking };
}

export function SpeakButton({
  text,
  label = "Play",
  className = "btn-secondary text-xs",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const { speak, speaking } = useChineseTTS();

  return (
    <button
      type="button"
      className={className}
      onClick={() => speak(text)}
      disabled={speaking}
    >
      {speaking ? "..." : label ? `🔊 ${label}` : "🔊"}
    </button>
  );
}
