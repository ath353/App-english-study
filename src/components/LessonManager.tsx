"use client";

import { useState, useTransition } from "react";

import {
  createLesson,
  deleteLesson,
  renameLesson,
} from "@/lib/actions/lessons";

type Lesson = {
  id: string;
  name: string;
  _count: { words: number };
};

const pillInputClass =
  "w-32 rounded border border-slate-300 px-2 py-0.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export function LessonManager({ lessons }: { lessons: Lesson[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  function startEdit(lesson: Lesson) {
    setEditingId(lesson.id);
    setDraftName(lesson.name);
  }

  function saveEdit(id: string) {
    const name = draftName.trim();
    if (!name) return;
    startTransition(async () => {
      await renameLesson(id, name);
      setEditingId(null);
    });
  }

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
              {editingId === lesson.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEdit(lesson.id);
                  }}
                  className="flex items-center gap-1"
                >
                  <input
                    autoFocus
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className={pillInputClass}
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="text-indigo-600 hover:text-indigo-800"
                    aria-label="Lưu tên bài"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Huỷ"
                  >
                    ×
                  </button>
                </form>
              ) : (
                <>
                  <span>
                    {lesson.name}{" "}
                    <span className="text-slate-400">
                      ({lesson._count.words})
                    </span>
                  </span>
                  <button
                    onClick={() => startEdit(lesson)}
                    className="text-slate-400 hover:text-indigo-600"
                    aria-label={`Sửa tên ${lesson.name}`}
                  >
                    ✏️
                  </button>
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
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
