"use client";

import { useRef, useState } from "react";
import { submitHomeworkAction } from "@/app/actions/learning";

export function HomeworkSubmitForm({
  homeworkId,
}: {
  homeworkId: string;
}) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
      if (audioPreview) URL.revokeObjectURL(audioPreview);
      setAudioPreview(URL.createObjectURL(blob));
      stream.getTracks().forEach((t) => t.stop());
    };
    mediaRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !audioBlob) {
      setError("Please add text or a voice recording.");
      return;
    }
    setSubmitting(true);
    setError("");

    let audioPath: string | null = null;
    if (audioBlob) {
      const form = new FormData();
      form.append("audio", audioBlob, "homework.webm");
      const res = await fetch("/api/upload-audio", { method: "POST", body: form });
      if (!res.ok) {
        setError("Failed to upload audio. Try again.");
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      audioPath = data.url;
    }

    const fd = new FormData();
    fd.append("homeworkId", homeworkId);
    if (text.trim()) fd.append("textAnswer", text.trim());
    if (audioPath) fd.append("audioPath", audioPath);

    await submitHomeworkAction(fd);
    setSubmitting(false);
    window.location.reload();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3">
      <textarea
        className="input min-h-24"
        placeholder="Your answer in Chinese or English..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        {!recording ? (
          <button type="button" className="btn-secondary" onClick={startRecording}>
            🎤 Record voice
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={stopRecording}>
            ⏹ Stop recording
          </button>
        )}
      </div>

      {audioPreview ? (
        <audio src={audioPreview} controls className="w-full" />
      ) : null}

      {error ? <p className="text-sm text-china-red">{error}</p> : null}

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit to Lin"}
      </button>
    </form>
  );
}
