import Link from "next/link";

import { auth, signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="Logo" className="h-16 w-16 rounded-full" />
          <h1 className="text-3xl font-bold text-slate-900">Học từ vựng Tiếng Anh</h1>
          <p className="max-w-xs text-sm text-slate-500">
            Thêm từ vựng tự do, ôn tập bằng flashcard — học mọi lúc mọi nơi.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button
            type="submit"
            className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Đăng nhập với Google
          </button>
        </form>
      </main>
    );
  }

  const wordCount = await prisma.word.count({
    where: { userId: session.user.id },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div>
        <p className="text-sm text-slate-500">Xin chào,</p>
        <h1 className="text-2xl font-bold text-slate-900">
          {session.user.name}
        </h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Tổng số từ vựng</p>
        <p className="text-4xl font-bold text-indigo-600">{wordCount}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/words"
          className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
        >
          <span className="text-2xl">➕</span>
          <span className="font-semibold text-slate-900">
            Quản lý từ vựng
          </span>
          <span className="text-sm text-slate-500">
            Thêm, sửa, xoá từ của bạn
          </span>
        </Link>
        <Link
          href="/review"
          className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
        >
          <span className="text-2xl">🔁</span>
          <span className="font-semibold text-slate-900">Ôn tập</span>
          <span className="text-sm text-slate-500">
            Lật thẻ, tự đánh giá mức nhớ
          </span>
        </Link>
      </div>
    </main>
  );
}
