"use client";

import { useRef, useState, useTransition } from "react";

import { reviewWord } from "@/lib/actions/words";
import { SpeakButton } from "@/components/SpeakButton";

type Word = {
  id: string;
  term: string;
  meaning: string | null;
  ipa: string | null;
  example: string | null;
  box: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function FlashcardReview({ words }: { words: Word[] }) {
  // Chốt danh sách và xáo trộn một lần khi bắt đầu lượt ôn — không đổi theo prop
  // nữa, để việc chấm điểm giữa chừng (làm danh sách đến hạn co lại ở server)
  // không làm nhảy thứ tự thẻ đang ôn.
  const [deck, setDeck] = useState(() => shuffle(words));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Số từ đến hạn thật sự của lượt này (deck có thể dài hơn do "Chưa nhớ" đưa
  // từ quay lại cuối hàng).
  const [totalDue] = useState(words.length);
  // Các từ đã được chấm điểm ghi vào database trong lượt này — chỉ đụng trong
  // handler, không đọc lúc render.
  const gradedIdsRef = useRef<Set<string>>(new Set());

  if (deck.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        Không có từ nào để ôn.
      </p>
    );
  }

  if (index >= deck.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <span className="text-4xl">🎉</span>
        <p className="text-lg font-semibold text-slate-900">
          Xong rồi! Bạn đã ôn hết {totalDue} từ đến hạn hôm nay.
        </p>
        <p className="text-sm text-slate-500">
          Các từ tiếp theo sẽ tự đến hạn theo lịch.
        </p>
      </div>
    );
  }

  const word = deck[index];

  function handleAnswer(remembered: boolean) {
    const current = word;
    startTransition(async () => {
      // Chỉ ghi lịch một lần cho mỗi từ trong lượt này. Lần gặp lại (do "Chưa
      // nhớ" đưa xuống cuối) chỉ để luyện thêm, không đổi lịch.
      const graded = gradedIdsRef.current;
      if (!graded.has(current.id)) {
        await reviewWord(current.id, remembered);
        graded.add(current.id);
      }
      if (!remembered) {
        setDeck((d) => [...d, current]);
      }
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
            style={{ width: `${(index / deck.length) * 100}%` }}
          />
        </div>
        <p className="shrink-0 text-sm font-medium text-slate-500">
          {index + 1} / {deck.length}
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
            {word.meaning ? (
              <p className="text-xl text-slate-700">{word.meaning}</p>
            ) : (
              <p className="text-sm italic text-amber-600">
                Chưa có nghĩa — vào trang Từ vựng để bổ sung
              </p>
            )}
            {word.example && (
              <p className="text-sm italic text-slate-500">{word.example}</p>
            )}
            <p className="text-xs text-slate-400">Hộp {word.box}/5</p>
          </div>
        )}
      </button>

      <SpeakButton
        text={word.term}
        label="Nghe phát âm"
        className="flex items-center gap-1 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
      />

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
