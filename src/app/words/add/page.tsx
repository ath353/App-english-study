import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WordForm } from "@/components/WordForm";

export default async function AddWordPage({
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

  const lessons = await prisma.lesson.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Thêm từ mới</h1>
        <Link href="/words" className="text-sm text-indigo-600 hover:underline">
          ← Về danh sách
        </Link>
      </div>

      <WordForm lessons={lessons} defaultLessonId={lessonId} />
    </main>
  );
}
