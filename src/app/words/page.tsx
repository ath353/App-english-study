import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WordForm } from "@/components/WordForm";
import { WordList } from "@/components/WordList";
import { LessonManager } from "@/components/LessonManager";
import { LessonTabs } from "@/components/LessonTabs";

const PAGE_SIZE = 50;

export default async function WordsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; limit?: string; lesson?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }
  const userId = session.user.id;

  const { q, limit, lesson: lessonId } = await searchParams;
  const query = q?.trim() ?? "";
  const take = Number(limit) > 0 ? Number(limit) : PAGE_SIZE;

  const baseWhere = {
    userId,
    ...(query
      ? {
          OR: [
            { term: { contains: query, mode: "insensitive" as const } },
            { meaning: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const where = {
    ...baseWhere,
    ...(lessonId ? { lessonId } : {}),
  };

  const [words, totalCount, overallCount, lessons] = await Promise.all([
    prisma.word.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      include: { lesson: { select: { name: true } } },
    }),
    prisma.word.count({ where }),
    prisma.word.count({ where: baseWhere }),
    prisma.lesson.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { words: true } } },
    }),
  ]);

  const hasMore = words.length < totalCount;
  const nextLimitParams = new URLSearchParams({
    ...(query ? { q: query } : {}),
    ...(lessonId ? { lesson: lessonId } : {}),
    limit: String(take + PAGE_SIZE),
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Từ vựng của tôi</h1>

      <div className="w-full max-w-xl">
        <LessonManager lessons={lessons} />
      </div>

      <div className="w-full max-w-xl">
        <WordForm lessons={lessons} defaultLessonId={lessonId} />
      </div>

      <form className="flex max-w-xl gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Tìm theo từ hoặc nghĩa..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Tìm
        </button>
      </form>

      <LessonTabs
        lessons={lessons}
        activeLessonId={lessonId}
        basePath="/words"
        totalCount={overallCount}
        extraParams={query ? { q: query } : {}}
      />

      <p className="text-sm text-slate-500">
        Hiện {words.length} / {totalCount} từ
        {query && ` (đang lọc theo "${query}")`}
      </p>

      <WordList words={words} lessons={lessons} />

      {hasMore && (
        <Link
          href={`/words?${nextLimitParams.toString()}`}
          scroll={false}
          className="self-center rounded-full bg-slate-100 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Xem thêm
        </Link>
      )}
    </main>
  );
}
