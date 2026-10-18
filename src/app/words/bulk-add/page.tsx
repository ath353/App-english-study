import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bulkCreateWords } from "@/lib/actions/words";
import { SubmitButton } from "@/components/SubmitButton";

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
        <h1 className="text-2xl font-bold text-fg">
          Nhập hàng loạt từ vựng
        </h1>
        <Link href="/words" className="text-sm text-indigo-600 hover:underline">
          ← Về danh sách
        </Link>
      </div>

      <div className="flex flex-col gap-2 text-sm text-muted">
        <p>Mỗi dòng 1 từ. Có 2 cách viết, trộn lẫn được:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Chỉ ghi từ, vd <code className="font-mono text-fg">apple</code>,
            rồi ở trang Từ vựng bấm{" "}
            <span className="font-medium">&quot;✨ Điền tự động&quot;</span>.
          </li>
          <li>
            Ghi đầy đủ, ngăn bởi dấu <code className="font-mono text-fg">|</code>:{" "}
            <code className="font-mono text-fg">
              từ | nghĩa | IPA | loại từ | câu Anh / câu Việt
            </code>
            . Cột nào không có thì để trống.
          </li>
        </ul>
        <p>
          Từ đã có sẵn trong danh sách sẽ không bị tạo trùng — chỉ được điền
          thêm vào những ô còn trống, không ghi đè nội dung cũ.
        </p>
      </div>

      <form
        action={bulkCreateWords}
        className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm"
      >
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-fg-soft" htmlFor="terms">
            Danh sách từ (mỗi dòng 1 từ)
          </label>
          <textarea
            id="terms"
            name="terms"
            required
            rows={12}
            placeholder={
              "apple\nthrow away | vứt đi | θroʊ əˈweɪ | v | Be throwing away some garbage / Vứt rác vào thùng\n..."
            }
            className="rounded-lg border border-line px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-fg-soft" htmlFor="lessonId">
            Thuộc Bài
          </label>
          <select
            id="lessonId"
            name="lessonId"
            defaultValue={defaultLessonId ?? ""}
            className="rounded-lg border border-line bg-surface text-fg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="" className="bg-surface text-fg">
              -- Không chọn --
            </option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id} className="bg-surface text-fg">
                {lesson.name}
              </option>
            ))}
          </select>
        </div>

        <SubmitButton
          pendingText="Đang lưu..."
          className="self-start rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          Lưu danh sách
        </SubmitButton>
      </form>
    </main>
  );
}
