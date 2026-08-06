"use client";

import { useTransition } from "react";

import { createLesson, deleteLesson } from "@/lib/actions/lessons";

type Lesson = {
  id: string;
  name: string;
  _count: { words: number };
};

export function LessonManager({ lessons }: { lessons: Lesson[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900">Quản lý Bài học</h2>

      <form
        action={(formData) => {
          startTransition(() => createLesson(formData));
        }}
        className="flex gap-2"
      >
        <input
          name="name"
          placeholder="Tên bài mới (vd: Bài 1)"
          required
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Tạo bài
        </button>
      </form>

      {lessons.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {lessons.map((lesson) => (
            <li
              key={lesson.id}
              className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700"
            >
              <span>
                {lesson.name}{" "}
                <span className="text-slate-400">
                  ({lesson._count.words})
                </span>
              </span>
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Xoá "${lesson.name}"? Từ vựng trong bài này sẽ không bị xoá, chỉ mất gắn nhãn.`,
                    )
                  ) {
                    startTransition(() => deleteLesson(lesson.id));
                  }
                }}
                className="text-slate-400 hover:text-red-600"
                aria-label={`Xoá ${lesson.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
