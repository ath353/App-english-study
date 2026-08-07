"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="vi">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <span className="text-4xl">😵</span>
          <h1 className="text-xl font-bold text-slate-900">
            Đã có lỗi xảy ra
          </h1>
          <p className="max-w-xs text-sm text-slate-500">
            Rất tiếc, đã có lỗi ngoài ý muốn. Dữ liệu của bạn vẫn an toàn —
            bạn có thể thử lại.
          </p>
          <button
            onClick={reset}
            className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Thử lại
          </button>
        </main>
      </body>
    </html>
  );
}
