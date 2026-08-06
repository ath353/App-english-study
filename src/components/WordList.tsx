"use client";

import { useState, useTransition } from "react";

import { deleteWord, updateWord } from "@/lib/actions/words";

type Word = {
  id: string;
  term: string;
  meaning: string;
  ipa: string | null;
  example: string | null;
  exampleTranslation: string | null;
  lessonId: string | null;
  lesson: { name: string } | null;
};

type Lesson = { id: string; name: string };

const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export function WordList({
  words,
  lessons,
}: {
  words: Word[];
  lessons: Lesson[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (words.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        Chưa có từ vựng nào. Thêm từ đầu tiên ở form bên trên.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {words.map((word) => (
        <li
          key={word.id}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          {editingId === word.id ? (
            <form
              action={(formData) => {
                startTransition(async () => {
                  await updateWord(word.id, formData);
                  setEditingId(null);
                });
              }}
              className="flex flex-col gap-2"
            >
              <input
                name="term"
                defaultValue={word.term}
                required
                className={inputClass}
              />
              <input
                name="meaning"
                defaultValue={word.meaning}
                required
                className={inputClass}
              />
              <input
                name="ipa"
                defaultValue={word.ipa ?? ""}
                placeholder="Phiên âm IPA"
                className={inputClass}
              />
              <textarea
                name="example"
                defaultValue={word.example ?? ""}
                placeholder="Câu ví dụ (tiếng Anh)"
                rows={2}
                className={inputClass}
              />
              <textarea
                name="exampleTranslation"
                defaultValue={word.exampleTranslation ?? ""}
                placeholder="Dịch nghĩa câu ví dụ (tiếng Việt)"
                rows={2}
                className={inputClass}
              />
              <select
                name="lessonId"
                defaultValue={word.lessonId ?? ""}
                className={inputClass}
              >
                <option value="">-- Không chọn --</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Huỷ
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {word.term}
                  </p>
                  {word.ipa && (
                    <p className="text-sm text-slate-400">/{word.ipa}/</p>
                  )}
                  {word.lesson && (
                    <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                      {word.lesson.name}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 gap-3 pt-1">
                  <button
                    onClick={() => setEditingId(word.id)}
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Xoá từ "${word.term}"?`)) {
                        startTransition(() => {
                          deleteWord(word.id);
                        });
                      }
                    }}
                    className="text-sm font-medium text-red-500 hover:underline"
                  >
                    Xoá
                  </button>
                </div>
              </div>
              <p className="text-slate-700">{word.meaning}</p>
              {word.example && (
                <p className="text-sm italic text-slate-500">{word.example}</p>
              )}
              {word.exampleTranslation && (
                <p className="text-sm italic text-slate-400">
                  {word.exampleTranslation}
                </p>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
