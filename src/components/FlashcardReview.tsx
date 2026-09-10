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
  definitionEn: string | null;
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

  // Vuốt thẻ (điện thoại): khi đã lật, vuốt phải = Nhớ, vuốt trái = Chưa nhớ.
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef(0);
  const SWIPE_THRESHOLD = 110;

  if (deck.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
        Không có từ nào để ôn.
      </p>
    );
  }

  if (index >= deck.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-10 text-center shadow-sm">
        <span className="text-4xl">🎉</span>
        <p className="text-lg font-semibold text-fg">
          Xong rồi! Bạn đã ôn hết {totalDue} từ đến hạn hôm nay.
        </p>
        <p className="text-sm text-muted">
          Các từ tiếp theo sẽ tự đến hạn theo lịch.
        </p>
      </div>
    );
  }

  const word = deck[index];

  const canSwipe = flipped && !isPending;

  function onTouchStart(e: React.TouchEvent) {
    if (!canSwipe) return;
    dragStartRef.current = e.touches[0].clientX;
    setDragging(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging) return;
    setDragX(e.touches[0].clientX - dragStartRef.current);
  }

  function onTouchEnd() {
    if (!dragging) return;
    setDragging(false);
    if (Math.abs(dragX) > SWIPE_THRESHOLD) {
      const remembered = dragX > 0;
      setDragX(dragX > 0 ? 600 : -600);
      window.setTimeout(() => {
        setDragX(0);
        handleAnswer(remembered);
      }, 180);
    } else {
      setDragX(0);
    }
  }

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
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${(index / deck.length) * 100}%` }}
          />
        </div>
        <p className="shrink-0 text-sm font-medium text-muted">
          {index + 1} / {deck.length}
        </p>
      </div>

      <div
        key={`${word.id}-${index}`}
        className="relative w-full max-w-md animate-fade-in"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${dragX}px) rotate(${dragX / 25}deg)`,
          transition: dragging ? "none" : "transform 0.3s ease",
        }}
      >
        {canSwipe && Math.abs(dragX) > 24 && (
          <span
            className={`pointer-events-none absolute -top-3 z-10 rounded-full px-3 py-1 text-sm font-bold ${
              dragX > 0
                ? "right-4 bg-emerald-500/20 text-emerald-600"
                : "left-4 bg-red-500/20 text-red-600"
            }`}
          >
            {dragX > 0 ? "✅ Nhớ" : "😵 Chưa"}
          </span>
        )}
        <div className="flip-scene">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? "Ẩn đáp án" : "Lật thẻ xem đáp án"}
          className={`flip-inner min-h-[300px] ${flipped ? "is-flipped" : ""}`}
        >
          <div className="flip-face gap-2 rounded-3xl border border-line bg-surface p-6 text-center shadow-sm">
            <p className="text-4xl font-bold text-fg">{word.term}</p>
            {word.ipa && (
              <p className="text-lg text-faint">/{word.ipa}/</p>
            )}
            <p className="mt-2 text-xs text-faint">Chạm để lật</p>
          </div>
          <div className="flip-face flip-back gap-2 rounded-3xl border border-line bg-surface p-6 text-center shadow-sm">
            <p className="text-3xl font-bold text-fg">
              {word.term}
              {word.ipa && (
                <span className="ml-2 text-lg font-normal text-faint">
                  /{word.ipa}/
                </span>
              )}
            </p>
            {word.meaning ? (
              <p className="text-xl text-fg-soft">{word.meaning}</p>
            ) : (
              <p className="text-sm italic text-amber-600">
                Chưa có nghĩa — vào trang Từ vựng để bổ sung
              </p>
            )}
            {word.example && (
              <p className="text-sm italic text-muted">{word.example}</p>
            )}
            {word.definitionEn && (
              <p className="text-xs text-faint">📖 {word.definitionEn}</p>
            )}
            <p className="text-xs text-faint">Hộp {word.box}/5</p>
          </div>
        </button>
        </div>
      </div>

      {flipped && (
        <p className="text-xs text-faint sm:hidden">
          Vuốt phải nếu nhớ, vuốt trái nếu chưa nhớ
        </p>
      )}

      <SpeakButton
        text={word.term}
        label="Nghe phát âm"
        className="flex items-center gap-1 rounded-full bg-surface-2 px-4 py-1.5 text-sm font-medium text-fg-soft hover:bg-surface-2-hover"
      />

      {!flipped ? (
        <button
          onClick={() => setFlipped(true)}
          className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Lật thẻ
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            disabled={isPending}
            onClick={() => handleAnswer(false)}
            className="rounded-full bg-red-500/10 px-6 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-500/20 disabled:opacity-50"
          >
            😵 Chưa nhớ
          </button>
          <button
            disabled={isPending}
            onClick={() => handleAnswer(true)}
            className="rounded-full bg-emerald-500/10 px-6 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50"
          >
            ✅ Nhớ rồi
          </button>
        </div>
      )}
    </div>
  );
}
