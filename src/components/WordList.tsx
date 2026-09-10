"use client";

import { useState, useTransition } from "react";

import {
  deleteWord,
  deleteWords,
  moveWords,
  updateWord,
} from "@/lib/actions/words";
import { SpeakButton } from "@/components/SpeakButton";

type Word = {
  id: string;
  term: string;
  meaning: string | null;
  ipa: string | null;
  example: string | null;
  definitionEn: string | null;
  status: "NEW" | "LEARNING" | "KNOWN";
  lessonId: string | null;
  lesson: { name: string } | null;
};

type Lesson = { id: string; name: string };

const STATUS_META: Record<Word["status"], { label: string; className: string }> =
  {
    NEW: { label: "Mới", className: "bg-surface-2 text-muted" },
    LEARNING: {
      label: "Đang học",
      className: "bg-amber-500/15 text-amber-600",
    },
    KNOWN: {
      label: "Đã thuộc",
      className: "bg-emerald-500/15 text-emerald-600",
    },
  };

const inputClass =
  "rounded-lg border border-line px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

function EditWordForm({
  word,
  lessons,
  onDone,
}: {
  word: Word;
  lessons: Lesson[];
  onDone: () => void;
}) {
  const [fields, setFields] = useState({
    term: word.term,
    meaning: word.meaning ?? "",
    ipa: word.ipa ?? "",
    example: word.example ?? "",
    definitionEn: word.definitionEn ?? "",
    lessonId: word.lessonId ?? "",
  });
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleAutoFill() {
    const term = fields.term.trim();
    if (!term) return;

    setIsLookingUp(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/dictionary?word=${encodeURIComponent(term)}`);
      const data = await res.json();

      if (!res.ok) {
        setLookupError(data.error ?? "Không tìm thấy từ này");
        return;
      }

      setFields((f) => ({
        ...f,
        meaning: data.meaning || f.meaning,
        ipa: data.ipa || f.ipa,
        example: data.example || f.example,
        definitionEn: data.definitionEn || f.definitionEn,
      }));
    } catch {
      setLookupError("Có lỗi khi tra từ điển, thử lại sau.");
    } finally {
      setIsLookingUp(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateWord(word.id, formData);
      if (result?.error) {
        setSaveError(result.error);
        return;
      }
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="term"
          value={fields.term}
          onChange={(e) => setFields((f) => ({ ...f, term: e.target.value }))}
          required
          className={`flex-1 ${inputClass}`}
        />
        {fields.term.trim() && (
          <SpeakButton
            text={fields.term}
            className="shrink-0 rounded-lg bg-surface-2 px-3 text-fg-soft hover:bg-surface-2-hover"
          />
        )}
        <button
          type="button"
          onClick={handleAutoFill}
          disabled={isLookingUp || !fields.term.trim()}
          className="shrink-0 rounded-lg bg-indigo-500/10 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-500/20 disabled:opacity-50"
        >
          {isLookingUp ? "Đang tra..." : "✨ Tự động điền"}
        </button>
      </div>
      {lookupError && <p className="text-sm text-red-600">{lookupError}</p>}

      <input
        name="meaning"
        value={fields.meaning}
        onChange={(e) => setFields((f) => ({ ...f, meaning: e.target.value }))}
        placeholder="Nghĩa tiếng Việt"
        required
        className={inputClass}
      />
      <textarea
        name="definitionEn"
        value={fields.definitionEn}
        onChange={(e) =>
          setFields((f) => ({ ...f, definitionEn: e.target.value }))
        }
        placeholder="Định nghĩa tiếng Anh (tự động điền, để tham khảo)"
        rows={2}
        className={inputClass}
      />
      <input
        name="ipa"
        value={fields.ipa}
        onChange={(e) => setFields((f) => ({ ...f, ipa: e.target.value }))}
        placeholder="Phiên âm IPA"
        className={inputClass}
      />
      <textarea
        name="example"
        value={fields.example}
        onChange={(e) => setFields((f) => ({ ...f, example: e.target.value }))}
        placeholder="Câu ví dụ (Anh / Việt) — vd: I hate you / Tôi ghét bạn"
        rows={2}
        className={inputClass}
      />
      <select
        name="lessonId"
        value={fields.lessonId}
        onChange={(e) => setFields((f) => ({ ...f, lessonId: e.target.value }))}
        className={inputClass}
      >
        <option value="">-- Không chọn --</option>
        {lessons.map((lesson) => (
          <option key={lesson.id} value={lesson.id}>
            {lesson.name}
          </option>
        ))}
      </select>

      {saveError && <p className="text-sm text-red-600">{saveError}</p>}

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
          onClick={onDone}
          className="rounded-lg bg-surface-2 px-3 py-1.5 text-sm font-medium text-fg-soft hover:bg-surface-2-hover"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}

export function WordList({
  words,
  lessons,
}: {
  words: Word[];
  lessons: Lesson[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Chỉ tính những ID đang thực sự hiện trong danh sách hiện tại — tránh trường hợp
  // đổi bộ lọc/tìm kiếm rồi lỡ tay xoá nhầm từ không còn hiển thị trên màn hình.
  const activeSelected = words.filter((w) => selectedIds.has(w.id));

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (activeSelected.length === words.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(words.map((w) => w.id)));
    }
  }

  function handleBulkDelete() {
    if (activeSelected.length === 0) return;
    if (
      confirm(
        `Xoá ${activeSelected.length} từ đã chọn? Không thể hoàn tác.`,
      )
    ) {
      const ids = activeSelected.map((w) => w.id);
      startTransition(async () => {
        await deleteWords(ids);
        setSelectedIds(new Set());
      });
    }
  }

  function handleBulkMove(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    e.target.value = ""; // đưa dropdown về trạng thái mặc định
    if (value === "" || activeSelected.length === 0) return;
    const lessonId = value === "__none__" ? null : value;
    const label =
      lessonId === null
        ? "bỏ khỏi Bài"
        : `chuyển sang "${lessons.find((l) => l.id === lessonId)?.name ?? ""}"`;
    if (!confirm(`${activeSelected.length} từ đã chọn — ${label}?`)) return;
    const ids = activeSelected.map((w) => w.id);
    startTransition(async () => {
      await moveWords(ids, lessonId);
      setSelectedIds(new Set());
    });
  }

  if (words.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
        Chưa có từ vựng nào. Thêm từ đầu tiên ở form bên trên.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <label className="flex items-center gap-2 text-fg-soft">
          <input
            type="checkbox"
            checked={activeSelected.length === words.length}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-line"
          />
          Chọn tất cả ({words.length})
        </label>

        {activeSelected.length > 0 && (
          <div className="flex items-center gap-2">
            {lessons.length > 0 && (
              <select
                onChange={handleBulkMove}
                disabled={isPending}
                defaultValue=""
                aria-label="Chuyển từ đã chọn sang Bài khác"
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-fg-soft disabled:opacity-50"
              >
                <option value="" disabled>
                  Chuyển sang Bài…
                </option>
                <option value="__none__">-- Bỏ khỏi Bài --</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={handleBulkDelete}
              disabled={isPending}
              className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
            >
              Xoá đã chọn ({activeSelected.length})
            </button>
          </div>
        )}
      </div>

      <ul className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {words.map((word) => (
        <li
          key={word.id}
          className={`rounded-2xl border border-line bg-surface p-5 shadow-sm ${
            editingId === word.id ? "col-span-full" : ""
          }`}
        >
          {editingId === word.id ? (
            <EditWordForm
              word={word}
              lessons={lessons}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(word.id)}
                    onChange={() => toggleSelected(word.id)}
                    className="mt-1.5 h-4 w-4 shrink-0 rounded border-line"
                    aria-label={`Chọn từ ${word.term}`}
                  />
                  <div>
                    <p className="flex items-center gap-1 text-lg font-semibold text-fg">
                      {word.term}
                      <SpeakButton text={word.term} />
                    </p>
                    {word.ipa && (
                      <p className="text-sm text-faint">/{word.ipa}/</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_META[word.status].className}`}
                      >
                        {STATUS_META[word.status].label}
                      </span>
                      {word.lesson && (
                        <span className="inline-block rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600">
                          {word.lesson.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-3 pt-1">
                  <button
                    onClick={() => setEditingId(word.id)}
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    Sửa
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => {
                      if (confirm(`Xoá từ "${word.term}"?`)) {
                        startTransition(() => {
                          deleteWord(word.id);
                        });
                      }
                    }}
                    className="text-sm font-medium text-red-500 hover:underline disabled:opacity-50"
                  >
                    Xoá
                  </button>
                </div>
              </div>
              {word.meaning ? (
                <p className="text-fg-soft">{word.meaning}</p>
              ) : (
                <p className="text-sm italic text-amber-600">
                  Chưa có nghĩa — bấm Sửa để tự động điền
                </p>
              )}
              {word.definitionEn && (
                <p className="text-xs text-muted">📖 {word.definitionEn}</p>
              )}
              {word.example && (
                <p className="text-sm italic text-muted">{word.example}</p>
              )}
            </div>
          )}
        </li>
      ))}
      </ul>
    </div>
  );
}
