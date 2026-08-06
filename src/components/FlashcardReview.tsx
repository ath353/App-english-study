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
      <p className="text-sm text-gray-500">
        Chưa có từ nào để ôn tập. Thêm từ ở trang "Quản lý từ vựng" trước đã
        nhé.
      </p>
    );
  }

  if (index >= words.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <p className="text-lg font-semibold">
          Bạn đã ôn hết {words.length} từ trong lượt này!
        </p>
        <button
          onClick={() => {
            setIndex(0);
            setFlipped(false);
          }}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
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
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-gray-500">
        {index + 1} / {words.length}
      </p>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-[200px] w-full max-w-md flex-col items-center justify-center gap-2 rounded-lg border border-gray-300 p-6 text-center"
      >
        {!flipped ? (
          <p className="text-3xl font-bold">{word.term}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-2xl font-bold">
              {word.term}
              {word.ipa && (
                <span className="ml-2 text-lg font-normal text-gray-500">
                  /{word.ipa}/
                </span>
              )}
            </p>
            <p className="text-lg">{word.meaning}</p>
            {word.example && (
              <p className="text-sm italic text-gray-500">{word.example}</p>
            )}
            {word.exampleTranslation && (
              <p className="text-sm italic text-gray-400">
                {word.exampleTranslation}
              </p>
            )}
          </div>
        )}
      </button>

      {!flipped ? (
        <button
          onClick={() => setFlipped(true)}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Lật thẻ
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            disabled={isPending}
            onClick={() => handleAnswer(false)}
            className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
          >
            Chưa nhớ
          </button>
          <button
            disabled={isPending}
            onClick={() => handleAnswer(true)}
            className="rounded-md bg-green-100 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
          >
            Nhớ rồi
          </button>
        </div>
      )}
    </div>
  );
}
