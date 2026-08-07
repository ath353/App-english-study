import Link from "next/link";

import { auth, signOut } from "@/lib/auth";

export async function Header() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="Logo" className="h-8 w-8 rounded-full" />
          English-Study
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/words"
            className="rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Từ vựng
          </Link>
          <Link
            href="/review"
            className="rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Ôn tập
          </Link>

          {session.user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={session.user.name ?? "avatar"}
              className="h-8 w-8 rounded-full ring-1 ring-slate-200"
            />
          )}

          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button
              type="submit"
              className="rounded-full bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
            >
              Đăng xuất
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
