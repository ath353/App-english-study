"use client";

import { useEffect } from "react";
import Link from "next/link";

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
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="text-4xl">😵</span>
      <h1 className="text-xl font-bold text-slate-900">
        Đã có lỗi xảy ra
      </h1>
      <p className="max-w-xs text-sm text-slate-500">
        Rất tiếc, đã có lỗi ngoài ý muốn. Dữ liệu của bạn vẫn an toàn — bạn có
        thể thử lại hoặc quay về trang chủ.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          Thử lại
        </button>
        <Link
          href="/"
          className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
        >
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
