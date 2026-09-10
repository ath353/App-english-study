import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FlashcardReview } from "@/components/FlashcardReview";
import { LessonTabs } from "@/components/LessonTabs";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }
  const userId = session.user.id;

  const { lesson: lessonId } = await searchParams;
  const lessonWhere =
    lessonId === "none"
      ? { lessonId: null }
      : lessonId
        ? { lessonId }
        : {};
  const scopeWhere = { userId, ...lessonWhere };
  const now = new Date();

  const [
    dueWords,
    totalInScope,
    totalCount,
    unclassifiedCount,
    statusGroups,
    lessons,
  ] = await Promise.all([
    prisma.word.findMany({
      where: { ...scopeWhere, dueAt: { lte: now } },
      orderBy: { dueAt: "asc" },
    }),
    prisma.word.count({ where: scopeWhere }),
    prisma.word.count({ where: { userId } }),
    prisma.word.count({ where: { userId, lessonId: null } }),
    prisma.word.groupBy({
      by: ["status"],
      where: scopeWhere,
      _count: { _all: true },
    }),
    prisma.lesson.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { words: true } } },
    }),
  ]);

  const countBy = (status: string) =>
    statusGroups.find((g) => g.status === status)?._count._all ?? 0;
  const newCount = countBy("NEW");
  const learningCount = countBy("LEARNING");
  const knownCount = countBy("KNOWN");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Ôn tập từ vựng</h1>

      <LessonTabs
        lessons={lessons}
        activeLessonId={lessonId}
        basePath="/review"
        totalCount={totalCount}
        unclassifiedCount={unclassifiedCount}
      />

      {totalInScope > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Cần ôn hôm nay</p>
          <p className="text-3xl font-bold text-indigo-600">{dueWords.length}</p>
          <p className="mt-1 text-xs text-slate-400">
            Tổng: {newCount} mới · {learningCount} đang học · {knownCount} đã thuộc
          </p>
        </div>
      )}

      {totalInScope === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Chưa có từ nào để ôn tập.{" "}
          <Link href="/words" className="text-indigo-600 hover:underline">
            Thêm từ ở trang Từ vựng
          </Link>{" "}
          trước đã nhé.
        </p>
      ) : dueWords.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <span className="text-4xl">🎉</span>
          <p className="text-lg font-semibold text-slate-900">
            Hôm nay không có từ nào đến hạn ôn!
          </p>
          <p className="text-sm text-slate-500">
            Quay lại sau nhé — các từ sẽ tự đến hạn theo lịch.
          </p>
        </div>
      ) : (
        <FlashcardReview words={dueWords} key={lessonId ?? "all"} />
      )}
    </main>
  );
}
