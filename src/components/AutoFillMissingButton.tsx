"use client";

import { useState } from "react";

import { autoFillMissing } from "@/lib/actions/words";

// Nút quét hết các từ chưa có nghĩa và tra từ điển điền tự động.
// Gọi server action theo từng mẻ nhỏ cho tới khi hết.
export function AutoFillMissingButton({
  count,
  lessonId,
}: {
  count: number;
  lessonId?: string;
}) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    processed: number;
    filled: number;
  } | null>(null);
  const [failed, setFailed] = useState(false);

  async function run() {
    setRunning(true);
    setProgress(0);
    setResult(null);
    setFailed(false);
    const attempted: string[] = [];
    let totalFilled = 0;
    try {
      // Chặn trên phòng khi có lỗi logic — tối đa vài trăm từ mỗi lượt bấm.
      for (let round = 0; round < 60; round++) {
        const { processedIds, filledMeaning } = await autoFillMissing(
          attempted,
          lessonId,
        );
        if (processedIds.length === 0) break;
        attempted.push(...processedIds);
        totalFilled += filledMeaning;
        setProgress(attempted.length);
      }
      setResult({ processed: attempted.length, filled: totalFilled });
    } catch {
      setFailed(true);
    } finally {
      setRunning(false);
    }
  }

  if (count === 0 && !result && !failed) return null;

  if (result) {
    return (
      <p className="text-sm text-slate-600">
        Đã điền nghĩa cho {result.filled}/{result.processed} từ.
        {result.filled < result.processed &&
          " Số còn lại từ điển không tra được — bạn tự điền, hoặc thử lại sau (có thể đã hết lượt dịch miễn phí hôm nay)."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="self-start rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
      >
        {running
          ? `Đang điền... ${progress}/${count}`
          : `✨ Điền tự động ${count} từ chưa có nghĩa`}
      </button>
      {running && (
        <p className="text-xs text-slate-400">
          Đừng rời trang khi đang chạy. Có thể mất vài phút nếu nhiều từ.
        </p>
      )}
      {failed && (
        <p className="text-xs text-red-600">
          Có lỗi khi điền tự động, thử lại sau nhé.
        </p>
      )}
    </div>
  );
}
