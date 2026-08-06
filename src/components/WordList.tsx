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
};

export function WordList({ words }: { words: Word[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (words.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Chưa có từ vựng nào. Thêm từ đầu tiên ở form bên trên.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {words.map((word) => (
        <li key={word.id} className="rounded-md border border-gray-300 p-4">
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
                className="rounded border border-gray-300 px-3 py-2"
              />
              <input
                name="meaning"
                defaultValue={word.meaning}
                required
                className="rounded border border-gray-300 px-3 py-2"
              />
              <input
                name="ipa"
                defaultValue={word.ipa ?? ""}
                placeholder="Phiên âm IPA"
                className="rounded border border-gray-300 px-3 py-2"
              />
              <textarea
                name="example"
                defaultValue={word.example ?? ""}
                placeholder="Câu ví dụ (tiếng Anh)"
                rows={2}
                className="rounded border border-gray-300 px-3 py-2"
              />
              <textarea
                name="exampleTranslation"
                defaultValue={word.exampleTranslation ?? ""}
                placeholder="Dịch nghĩa câu ví dụ (tiếng Việt)"
                rows={2}
                className="rounded border border-gray-300 px-3 py-2"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-300"
                >
                  Huỷ
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">
                  {word.term}
                  {word.ipa && (
                    <span className="ml-2 font-normal text-gray-500">
                      /{word.ipa}/
                    </span>
                  )}
                </p>
                <div className="flex shrink-0 gap-3">
                  <button
                    onClick={() => setEditingId(word.id)}
                    className="text-sm text-blue-600 hover:underline"
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
                    className="text-sm text-red-600 hover:underline"
                  >
                    Xoá
                  </button>
                </div>
              </div>
              <p>{word.meaning}</p>
              {word.example && (
                <p className="text-sm italic text-gray-500">{word.example}</p>
              )}
              {word.exampleTranslation && (
                <p className="text-sm italic text-gray-400">
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
