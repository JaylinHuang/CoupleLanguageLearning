"use client";

import { useRef, useState } from "react";
import { completeSpeakingAction } from "@/app/actions/learning";
import { SpeakButton } from "@/components/speak-button";
import type { SpeakingPhrase } from "@/lib/exercises";

export function SpeakingPractice({ phrases }: { phrases: SpeakingPhrase[] }) {
  const [index, setIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [practiced, setPracticed] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);

  if (phrases.length === 0) {
    return (
      <div className="card p-6 text-center text-warm-gray">
        No phrases available yet.
      </div>
    );
  }

  if (done) {
    return (
      <div className="card p-6 text-center">
        <p className="text-4xl">🎤</p>
        <p className="mt-2 text-xl font-semibold text-warm-brown">
          Speaking practice done!
        </p>
        <p className="mt-1 text-sm text-warm-gray">
          You practiced {practiced.size} phrases. Your partner would love to hear you!
        </p>
        <a href="/" className="btn-primary mt-4 inline-flex">
          Back to Home
        </a>
      </div>
    );
  }

  const current = phrases[index];

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(blob));
      setDuration(Math.round((Date.now() - startTimeRef.current) / 1000));
      stream.getTracks().forEach((t) => t.stop());
    };
    mediaRef.current = recorder;
    startTimeRef.current = Date.now();
    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  async function markPracticed() {
    const next = new Set(practiced);
    next.add(current.id);
    setPracticed(next);
    setAudioUrl(null);
    setDuration(0);

    if (index < phrases.length - 1) {
      setIndex((i) => i + 1);
    } else {
      setSubmitting(true);
      await completeSpeakingAction(next.size);
      setDone(true);
      setSubmitting(false);
    }
  }

  return (
    <div className="card space-y-4 p-5">
      <p className="text-xs text-warm-gray">
        Phrase {index + 1} of {phrases.length}
      </p>

      <div className="rounded-xl bg-blush/30 p-4 text-center">
        <p className="font-chinese text-3xl text-warm-brown">{current.chinese}</p>
        <p className="mt-1 text-sm text-coral-dark">{current.pinyin}</p>
        <p className="mt-1 text-sm text-warm-gray">{current.english}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <SpeakButton text={current.chinese} label="Listen" />
        {!recording ? (
          <button type="button" className="btn-primary" onClick={startRecording}>
            🎤 Record
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={stopRecording}>
            ⏹ Stop
          </button>
        )}
      </div>

      {audioUrl ? (
        <div className="rounded-xl border border-blush bg-white p-3">
          <p className="text-sm font-medium text-warm-brown">Your recording</p>
          <audio src={audioUrl} controls className="mt-2 w-full" />
          <p className="mt-2 text-xs text-warm-gray">
            Duration: {duration}s — Compare with the standard audio above!
          </p>
        </div>
      ) : null}

      <div className="flex justify-between gap-3">
        <button
          type="button"
          className="btn-secondary"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={!audioUrl || submitting}
          onClick={markPracticed}
        >
          {submitting
            ? "Saving..."
            : index < phrases.length - 1
              ? "Next phrase"
              : "Finish"}
        </button>
      </div>
    </div>
  );
}
