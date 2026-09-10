"use client";

// Nút phát âm dùng giọng đọc sẵn của trình duyệt (Web Speech API).
// Không cần API ngoài, không lo link hỏng, chạy được cả khi offline.
// Trình duyệt nào không hỗ trợ thì bấm không có gì xảy ra (không lỗi).
export function SpeakButton({
  text,
  label,
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  function speak(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const clean = text.trim();
    if (!clean || typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={speak}
      aria-label={`Nghe phát âm "${text}"`}
      title="Nghe phát âm"
      className={
        className ??
        "shrink-0 rounded-full px-1.5 text-slate-400 hover:text-indigo-600"
      }
    >
      🔊{label ? ` ${label}` : ""}
    </button>
  );
}
