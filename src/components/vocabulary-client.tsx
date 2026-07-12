"use client";

import {
  markWordHardFormAction,
  addWishFormAction,
} from "@/app/actions/learning";

type WordRow = {
  id: string;
  simplified: string;
  pinyin: string;
  english: string;
  isCustom: boolean;
  markedHard: boolean;
};

export function VocabularyClient({ words }: { words: WordRow[] }) {
  return (
    <div className="space-y-6">
      <form action={addWishFormAction} className="card space-y-3 p-4">
        <h2 className="font-medium text-warm-brown">I want to learn about...</h2>
        <input
          name="wish"
          className="input"
          placeholder="e.g. ordering food, meeting your parents"
          required
        />
        <button type="submit" className="btn-primary">
          Send to Lin
        </button>
      </form>

      <div className="space-y-2">
        {words.map((w) => (
          <div key={w.id} className="card flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-chinese text-xl">{w.simplified}</p>
              <p className="text-sm text-coral-dark">{w.pinyin}</p>
              <p className="text-sm text-warm-gray">{w.english}</p>
              {w.isCustom ? <span className="badge mt-1">Custom</span> : null}
            </div>
            <form action={markWordHardFormAction}>
              <input type="hidden" name="wordId" value={w.id} />
              <button type="submit" className="btn-secondary text-xs">
                {w.markedHard ? "Hard ✓" : "Mark hard"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
