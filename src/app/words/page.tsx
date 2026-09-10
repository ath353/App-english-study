import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WordList } from "@/components/WordList";
import { LessonManager } from "@/components/LessonManager";
import { LessonTabs } from "@/components/LessonTabs";
import { SearchForm } from "@/components/SearchForm";
import { SortSelect } from "@/components/SortSelect";
import { AutoFillMissingButton } from "@/components/AutoFillMissingButton";

// Cho phép server action "điền tự động hàng loạt" chạy lâu hơn mặc định.
export const maxDuration = 60;

const PAGE_SIZE = 50;

const STATUS_FILTERS = [
  { value: "", label: "Mọi trạng thái" },
  { value: "NEW", label: "Mới" },
  { value: "LEARNING", label: "Đang học" },
  { value: "KNOWN", label: "Đã thuộc" },
] as const;

const SORTS: Record<string, Prisma.WordOrderByWithRelationInput[]> = {
  new: [{ createdAt: "desc" }, { id: "desc" }],
  az: [{ term: "asc" }, { id: "asc" }],
  due: [{ dueAt: "asc" }, { id: "asc" }],
};

export default async function WordsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    limit?: string;
    lesson?: string;
    status?: string;
    sort?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }
  const userId = session.user.id;

  const {
    q,
    limit,
    lesson: lessonId,
    status,
    sort: sortRaw,
  } = await searchParams;
  const query = q?.trim() ?? "";
  const take = Number(limit) > 0 ? Number(limit) : PAGE_SIZE;
  const activeStatus =
    status === "NEW" || status === "LEARNING" || status === "KNOWN"
      ? (status as "NEW" | "LEARNING" | "KNOWN")
      : undefined;
  const sort = sortRaw && sortRaw in SORTS ? sortRaw : "new";

  // Ghép URL /words giữ nguyên các bộ lọc đang bật, chỉ đổi phần được truyền vào.
  const hrefWith = (overrides: Record<string, string | undefined>) => {
    const merged: Record<string, string | undefined> = {
      q: query || undefined,
      lesson: lessonId || undefined,
      status: activeStatus,
      sort: sort !== "new" ? sort : undefined,
      ...overrides,
    };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `/words?${qs}` : "/words";
  };

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
    ...(activeStatus ? { status: activeStatus } : {}),
  };
  const lessonWhere =
    lessonId === "none"
      ? { lessonId: null }
      : lessonId
        ? { lessonId }
        : {};
  const where = { ...baseWhere, ...lessonWhere };

  const [
    words,
    totalCount,
    overallCount,
    unclassifiedCount,
    missingMeaningCount,
    lessons,
  ] = await Promise.all([
    prisma.word.findMany({
      where,
      orderBy: SORTS[sort],
      take,
      include: { lesson: { select: { name: true } } },
    }),
    prisma.word.count({ where }),
    prisma.word.count({ where: baseWhere }),
    prisma.word.count({ where: { userId, lessonId: null } }),
    prisma.word.count({
      where: {
        userId,
        ...lessonWhere,
        OR: [{ meaning: null }, { meaning: "" }],
      },
    }),
    prisma.lesson.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { words: true } } },
    }),
  ]);

  const hasMore = words.length < totalCount;
  const tabsParams: Record<string, string> = {
    ...(query ? { q: query } : {}),
    ...(activeStatus ? { status: activeStatus } : {}),
    ...(sort !== "new" ? { sort } : {}),
  };
  const autoFillLessonId = lessonId === "none" ? undefined : lessonId;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-fg">Từ vựng của tôi</h1>
        <div className="flex gap-2">
          <Link
            href={`/words/bulk-add${autoFillLessonId ? `?lesson=${autoFillLessonId}` : ""}`}
            className="flex-1 whitespace-nowrap rounded-full bg-surface-2 px-4 py-2 text-center text-sm font-semibold text-fg-soft hover:bg-surface-2-hover sm:flex-none"
          >
            Nhập hàng loạt
          </Link>
          <Link
            href={`/words/add${autoFillLessonId ? `?lesson=${autoFillLessonId}` : ""}`}
            className="flex-1 whitespace-nowrap rounded-full bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 sm:flex-none"
          >
            + Thêm từ
          </Link>
        </div>
      </div>

      {missingMeaningCount > 0 && (
        <AutoFillMissingButton
          count={missingMeaningCount}
          lessonId={autoFillLessonId}
        />
      )}

      <div className="w-full max-w-xl">
        <LessonManager lessons={lessons} />
      </div>

      <SearchForm
        defaultQuery={query}
        lessonId={lessonId}
        status={activeStatus}
        sort={sort !== "new" ? sort : undefined}
      />

      <LessonTabs
        lessons={lessons}
        activeLessonId={lessonId}
        basePath="/words"
        totalCount={overallCount}
        unclassifiedCount={unclassifiedCount}
        extraParams={tabsParams}
      />

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => {
          const active = (activeStatus ?? "") === s.value;
          return (
            <Link
              key={s.value || "all"}
              href={hrefWith({ status: s.value || undefined })}
              scroll={false}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                active
                  ? "bg-indigo-600 text-white"
                  : "bg-surface-2 text-fg-soft hover:bg-surface-2-hover"
              }`}
            >
              {s.label}
            </Link>
          );
        })}
        <div className="ml-auto">
          <SortSelect
            value={sort}
            q={query || undefined}
            lessonId={lessonId}
            status={activeStatus}
          />
        </div>
      </div>

      <p className="text-sm text-muted">
        Hiện {words.length} / {totalCount} từ
        {query && ` (đang lọc theo "${query}")`}
      </p>

      <WordList words={words} lessons={lessons} />

      {hasMore && (
        <Link
          href={hrefWith({ limit: String(take + PAGE_SIZE) })}
          scroll={false}
          className="self-center rounded-full bg-surface-2 px-5 py-2 text-sm font-medium text-fg-soft hover:bg-surface-2-hover"
        >
          Xem thêm
        </Link>
      )}
    </main>
  );
}
