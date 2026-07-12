"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
};

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(options?: { lang?: string }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    setSupported(!!getSpeechRecognition());
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(
    (onResult?: (text: string) => void) => {
      const SR = getSpeechRecognition();
      if (!SR) return;

      recognitionRef.current?.stop();
      const recognition = new SR();
      recognition.lang = options?.lang ?? "zh-CN";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const results = event.results;
        let text = "";
        for (let i = 0; i < results.length; i++) {
          text += results[i]?.[0]?.transcript ?? "";
        }
        setTranscript(text);
        const last = results[results.length - 1];
        if (last?.isFinal) {
          onResult?.(text);
        }
      };

      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);

      recognitionRef.current = recognition;
      setTranscript("");
      setListening(true);
      recognition.start();
    },
    [options?.lang],
  );

  return { start, stop, listening, transcript, supported };
}

export function VoiceInputButton({
  onTranscript,
  disabled,
  className = "btn-secondary shrink-0 px-3",
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const { start, stop, listening, supported } = useSpeechRecognition({ lang: "zh-CN" });

  if (!supported) return null;

  return (
    <button
      type="button"
      className={`${className} ${listening ? "ring-2 ring-coral" : ""}`}
      disabled={disabled}
      title={listening ? "Stop listening" : "Voice input (Chinese)"}
      onClick={() => {
        if (listening) {
          stop();
        } else {
          start(onTranscript);
        }
      }}
    >
      {listening ? "🎙️..." : "🎤"}
    </button>
  );
}
