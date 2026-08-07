import Link from "next/link";

import { auth, signOut } from "@/lib/auth";

export async function Header() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-3 py-2 sm:px-6 sm:py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-lg font-bold text-slate-900"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt="Logo"
            className="h-8 w-8 rounded-full"
          />
          <span className="hidden sm:inline">English-Study</span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-3">
          <Link
            href="/words"
            className="rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 sm:px-3 sm:py-1.5 sm:text-sm"
          >
            Từ vựng
          </Link>
          <Link
            href="/review"
            className="rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 sm:px-3 sm:py-1.5 sm:text-sm"
          >
            Ôn tập
          </Link>

          {session.user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={session.user.name ?? "avatar"}
              className="hidden h-8 w-8 rounded-full ring-1 ring-slate-200 sm:block"
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
              className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-red-700 sm:px-3 sm:py-1.5 sm:text-sm"
            >
              Đăng xuất
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
