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

  const [words, totalCount, lessons] = await Promise.all([
    prisma.word.findMany({
      where: { userId, ...(lessonId ? { lessonId } : {}) },
      orderBy: { createdAt: "asc" },
    }),
    prisma.word.count({ where: { userId } }),
    prisma.lesson.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { words: true } } },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Ôn tập từ vựng</h1>

      <LessonTabs
        lessons={lessons}
        activeLessonId={lessonId}
        basePath="/review"
        totalCount={totalCount}
      />

      <FlashcardReview words={words} key={lessonId ?? "all"} />
    </main>
  );
}
