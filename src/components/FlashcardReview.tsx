"use client";

import { useState, useTransition } from "react";

import { reviewWord } from "@/lib/actions/words";

type Word = {
  id: string;
  term: string;
  meaning: string;
  ipa: string | null;
  example: string | null;
  exampleTranslation: string | null;
};

export function FlashcardReview({ words }: { words: Word[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (words.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        Chưa có từ nào để ôn tập. Thêm từ ở trang "Từ vựng" trước đã nhé.
      </p>
    );
  }

  if (index >= words.length) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <span className="text-4xl">🎉</span>
        <p className="text-lg font-semibold text-slate-900">
          Bạn đã ôn hết {words.length} từ trong lượt này!
        </p>
        <button
          onClick={() => {
            setIndex(0);
            setFlipped(false);
          }}
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          Ôn lại từ đầu
        </button>
      </div>
    );
  }

  const word = words[index];

  function handleAnswer(remembered: boolean) {
    startTransition(async () => {
      await reviewWord(word.id, remembered);
      setFlipped(false);
      setIndex((i) => i + 1);
    });
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-full max-w-md items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${(index / words.length) * 100}%` }}
          />
        </div>
        <p className="shrink-0 text-sm font-medium text-slate-500">
          {index + 1} / {words.length}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-[240px] w-full max-w-md flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm transition hover:shadow-md"
      >
        {!flipped ? (
          <p className="text-4xl font-bold text-slate-900">{word.term}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-3xl font-bold text-slate-900">
              {word.term}
              {word.ipa && (
                <span className="ml-2 text-lg font-normal text-slate-400">
                  /{word.ipa}/
                </span>
              )}
            </p>
            <p className="text-xl text-slate-700">{word.meaning}</p>
            {word.example && (
              <p className="text-sm italic text-slate-500">{word.example}</p>
            )}
            {word.exampleTranslation && (
              <p className="text-sm italic text-slate-400">
                {word.exampleTranslation}
              </p>
            )}
          </div>
        )}
      </button>

      {!flipped ? (
        <button
          onClick={() => setFlipped(true)}
          className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Lật thẻ
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            disabled={isPending}
            onClick={() => handleAnswer(false)}
            className="rounded-full bg-red-50 px-6 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            😵 Chưa nhớ
          </button>
          <button
            disabled={isPending}
            onClick={() => handleAnswer(true)}
            className="rounded-full bg-emerald-50 px-6 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          >
            ✅ Nhớ rồi
          </button>
        </div>
      )}
    </div>
  );
}
