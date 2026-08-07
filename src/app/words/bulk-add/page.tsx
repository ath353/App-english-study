import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bulkCreateWords } from "@/lib/actions/words";

export default async function BulkAddWordsPage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }
  const userId = session.user.id;

  const { lesson: defaultLessonId } = await searchParams;

  const lessons = await prisma.lesson.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Nhập hàng loạt từ vựng
        </h1>
        <Link href="/words" className="text-sm text-indigo-600 hover:underline">
          ← Về danh sách
        </Link>
      </div>

      <p className="text-sm text-slate-500">
        Dán danh sách từ, mỗi dòng 1 từ. Các từ sẽ được lưu ngay lập tức
        (chưa có nghĩa/IPA/ví dụ) — bạn bổ sung chi tiết cho từng từ sau bằng
        nút &quot;Tự động điền&quot; ở chế độ Sửa trong danh sách.
      </p>

      <form
        action={bulkCreateWords}
        className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="terms">
            Danh sách từ (mỗi dòng 1 từ)
          </label>
          <textarea
            id="terms"
            name="terms"
            required
            rows={12}
            placeholder={"apple\nbanana\ncomputer\n..."}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="lessonId">
            Thuộc Bài
          </label>
          <select
            id="lessonId"
            name="lessonId"
            defaultValue={defaultLessonId ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">-- Không chọn --</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="self-start rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          Lưu danh sách
        </button>
      </form>
    </main>
  );
}
