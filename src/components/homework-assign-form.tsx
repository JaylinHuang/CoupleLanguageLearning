"use client";

import { useRef, useState } from "react";
import { createHomeworkAction } from "@/app/actions/learning";

// Tutor 布置作业的表单：支持附带语音留言
export function HomeworkAssignForm() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (!String(fd.get("title") ?? "").trim()) return;

    setSubmitting(true);
    setError("");

    // 有录音先上传，把 URL 一起交给 server action
    if (audioBlob) {
      const uploadForm = new FormData();
      uploadForm.append("audio", audioBlob, "homework-voice.webm");
      const res = await fetch("/api/upload-audio", {
        method: "POST",
        body: uploadForm,
      });
      if (!res.ok) {
        setError("Failed to upload voice message. Try again.");
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      fd.append("audioPath", data.url);
    }

    await createHomeworkAction(fd);
    form.reset();
    setAudioBlob(null);
    setAudioPreview(null);
    setSubmitting(false);
    window.location.reload();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="card mb-6 space-y-3 p-4">
      <h2 className="font-medium">Assign homework</h2>
      <input name="title" className="input" placeholder="Title" required />
      <textarea
        name="description"
        className="input min-h-20"
        placeholder="Instructions for learner"
      />

      <div className="flex flex-wrap items-center gap-2">
        {!recording ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={startRecording}
          >
            🎤 Record voice message
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={stopRecording}>
            ⏹ Stop recording
          </button>
        )}
        {audioPreview && !recording ? (
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => {
              setAudioBlob(null);
              setAudioPreview(null);
            }}
          >
            ✕ Remove
          </button>
        ) : null}
      </div>

      {audioPreview ? (
        <audio src={audioPreview} controls className="w-full" />
      ) : null}

      {error ? <p className="text-sm text-china-red">{error}</p> : null}

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Assigning..." : "Assign"}
      </button>
    </form>
  );
}
