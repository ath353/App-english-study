"use client";

import { useState, useSyncExternalStore, useTransition } from "react";

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

const STATUS_META: Record<
  Word["status"],
  { label: string; badge: string; edge: string }
> = {
  NEW: {
    label: "Mới",
    badge: "bg-surface-2 text-muted",
    edge: "border-l-line",
  },
  LEARNING: {
    label: "Đang học",
    badge: "bg-amber-500/15 text-amber-600",
    edge: "border-l-amber-400",
  },
  KNOWN: {
    label: "Đã thuộc",
    badge: "bg-emerald-500/15 text-emerald-600",
    edge: "border-l-emerald-400",
  },
};

const inputClass =
  "rounded-lg border border-line px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

// Ghi nhớ kiểu hiển thị (thẻ / bảng) riêng cho trình duyệt này.
const VIEW_KEY = "words-view";
function useSavedView(): ["card" | "table", (v: "card" | "table") => void] {
  const view = useSyncExternalStore(
    (cb) => {
      window.addEventListener("words-view-change", cb);
      return () => window.removeEventListener("words-view-change", cb);
    },
    () => {
      try {
        return localStorage.getItem(VIEW_KEY) === "table" ? "table" : "card";
      } catch {
        return "card";
      }
    },
    () => "card" as const,
  );
  const setView = (v: "card" | "table") => {
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* bỏ qua nếu trình duyệt chặn localStorage */
    }
    window.dispatchEvent(new Event("words-view-change"));
  };
  return [view, setView];
}

// Nút Sửa / Xoá dùng chung cho cả thẻ lẫn bảng.
function RowActions({
  onEdit,
  onDelete,
  disabled,
  revealOnHover,
}: {
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
  revealOnHover?: boolean;
}) {
  const reveal = revealOnHover
    ? "hover-device:opacity-0 hover-device:group-hover:opacity-100"
    : "";
  return (
    <div
      className={`flex shrink-0 gap-1 transition-opacity ${reveal}`}
    >
      <button
        onClick={onEdit}
        className="rounded-md bg-surface-2 px-2 py-1 text-xs font-medium text-fg-soft hover:bg-surface-2-hover"
      >
        Sửa
      </button>
      <button
        disabled={disabled}
        onClick={onDelete}
        className="rounded-md bg-surface-2 px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-500/15 disabled:opacity-50"
      >
        Xoá
      </button>
    </div>
  );
}

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
  listKey,
}: {
  words: Word[];
  lessons: Lesson[];
  listKey?: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useSavedView();

  // Chỉ tính những ID đang thực sự hiện trong danh sách hiện tại — tránh xoá nhầm
  // từ không còn hiển thị sau khi đổi bộ lọc.
  const activeSelected = words.filter((w) => selectedIds.has(w.id));

  function exitSelection() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (activeSelected.length === words.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(words.map((w) => w.id)));
  }

  function handleBulkDelete() {
    if (activeSelected.length === 0) return;
    if (!confirm(`Xoá ${activeSelected.length} từ đã chọn? Không thể hoàn tác.`))
      return;
    const ids = activeSelected.map((w) => w.id);
    startTransition(async () => {
      await deleteWords(ids);
      exitSelection();
    });
  }

  function handleBulkMove(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    e.target.value = "";
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
      exitSelection();
    });
  }

  function deleteOne(word: Word) {
    if (!confirm(`Xoá từ "${word.term}"?`)) return;
    startTransition(() => {
      deleteWord(word.id);
    });
  }

  if (words.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
        Chưa có từ vựng nào. Thêm từ đầu tiên ở form bên trên.
      </p>
    );
  }

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {selectionMode ? (
        <>
          <label className="flex items-center gap-2 text-fg-soft">
            <input
              type="checkbox"
              checked={activeSelected.length === words.length}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-line"
            />
            Chọn tất cả ({words.length})
          </label>
          {activeSelected.length > 0 && lessons.length > 0 && (
            <select
              onChange={handleBulkMove}
              disabled={isPending}
              defaultValue=""
              aria-label="Chuyển từ đã chọn sang Bài khác"
              className="rounded-full border border-line bg-surface px-3 py-1.5 font-medium text-fg-soft disabled:opacity-50"
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
          {activeSelected.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isPending}
              className="rounded-full bg-red-600 px-4 py-1.5 font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
            >
              Xoá đã chọn ({activeSelected.length})
            </button>
          )}
          <button
            onClick={exitSelection}
            className="rounded-full bg-surface-2 px-4 py-1.5 font-medium text-fg-soft hover:bg-surface-2-hover"
          >
            Xong
          </button>
        </>
      ) : (
        <button
          onClick={() => setSelectionMode(true)}
          className="rounded-full bg-surface-2 px-4 py-1.5 font-medium text-fg-soft hover:bg-surface-2-hover"
        >
          Chọn
        </button>
      )}

      <div className="ml-auto flex overflow-hidden rounded-full border border-line">
        {(["card", "table"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 font-medium ${
              view === v
                ? "bg-indigo-600 text-white"
                : "bg-surface text-fg-soft hover:bg-surface-2"
            }`}
          >
            {v === "card" ? "Thẻ" : "Bảng"}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {toolbar}

      {view === "card" ? (
        <ul
          key={`card-${listKey}`}
          className="grid animate-fade-in grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {words.map((word) => (
            <li
              key={word.id}
              className={`group rounded-2xl border border-l-4 border-line bg-surface p-4 shadow-sm transition hover-device:hover:-translate-y-0.5 hover-device:hover:shadow-md ${
                STATUS_META[word.status].edge
              } ${editingId === word.id ? "col-span-full" : ""}`}
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
                    <div className="flex min-w-0 items-baseline gap-1.5">
                      {selectionMode && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(word.id)}
                          onChange={() => toggleSelected(word.id)}
                          className="mr-1 h-4 w-4 self-center rounded border-line"
                          aria-label={`Chọn từ ${word.term}`}
                        />
                      )}
                      <span className="text-lg font-semibold text-fg">
                        {word.term}
                      </span>
                      {word.ipa && (
                        <span className="text-sm text-faint">/{word.ipa}/</span>
                      )}
                      <SpeakButton text={word.term} />
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {word.lesson && (
                        <span className="hidden rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600 sm:inline">
                          {word.lesson.name}
                        </span>
                      )}
                      <RowActions
                        onEdit={() => setEditingId(word.id)}
                        onDelete={() => deleteOne(word)}
                        disabled={isPending}
                        revealOnHover
                      />
                    </div>
                  </div>

                  {word.meaning ? (
                    <p className="text-fg-soft">{word.meaning}</p>
                  ) : (
                    <p className="text-sm italic text-amber-600">
                      Chưa có nghĩa — bấm Sửa để tự động điền
                    </p>
                  )}

                  {(word.definitionEn || word.example) && (
                    <div className="flex flex-col gap-0.5 border-t border-line pt-1.5 text-xs text-muted">
                      {word.definitionEn && <p>📖 {word.definitionEn}</p>}
                      {word.example && (
                        <p className="italic">{word.example}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div
          key={`table-${listKey}`}
          className="animate-fade-in overflow-x-auto rounded-2xl border border-line"
        >
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-left text-xs uppercase text-muted">
                {selectionMode && <th className="w-10 px-3 py-2"></th>}
                <th className="px-3 py-2">Từ</th>
                <th className="px-3 py-2">Nghĩa</th>
                <th className="px-3 py-2">Bài</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {words.map((word) => {
                const cols = selectionMode ? 6 : 5;
                if (editingId === word.id) {
                  return (
                    <tr key={word.id} className="border-b border-line">
                      <td colSpan={cols} className="bg-surface p-3">
                        <EditWordForm
                          word={word}
                          lessons={lessons}
                          onDone={() => setEditingId(null)}
                        />
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr
                    key={word.id}
                    className="group border-b border-line last:border-0 hover:bg-surface-2/50"
                  >
                    {selectionMode && (
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(word.id)}
                          onChange={() => toggleSelected(word.id)}
                          className="h-4 w-4 rounded border-line"
                          aria-label={`Chọn từ ${word.term}`}
                        />
                      </td>
                    )}
                    <td className="px-3 py-2 align-top">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-semibold text-fg">
                          {word.term}
                        </span>
                        <SpeakButton text={word.term} />
                      </div>
                      {word.ipa && (
                        <div className="text-xs text-faint">/{word.ipa}/</div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {word.meaning ? (
                        <span className="text-fg-soft">{word.meaning}</span>
                      ) : (
                        <span className="text-xs italic text-amber-600">
                          Chưa có nghĩa
                        </span>
                      )}
                      {word.example && (
                        <div className="truncate text-xs italic text-muted">
                          {word.example}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-muted">
                      {word.lesson?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_META[word.status].badge}`}
                      >
                        {STATUS_META[word.status].label}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <RowActions
                        onEdit={() => setEditingId(word.id)}
                        onDelete={() => deleteOne(word)}
                        disabled={isPending}
                        revealOnHover
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
