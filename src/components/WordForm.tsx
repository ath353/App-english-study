"use client";

import { useState, useTransition } from "react";

import { createWord } from "@/lib/actions/words";

type Lesson = { id: string; name: string };

const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

const labelClass = "text-sm font-medium text-slate-700";

export function WordForm({
  lessons,
  defaultLessonId,
}: {
  lessons: Lesson[];
  defaultLessonId?: string;
}) {
  const emptyFields = {
    term: "",
    meaning: "",
    ipa: "",
    example: "",
    exampleTranslation: "",
    lessonId: defaultLessonId ?? "",
  };
  const [fields, setFields] = useState(emptyFields);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
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
        exampleTranslation: data.exampleTranslation || f.exampleTranslation,
      }));
    } catch {
      setLookupError("Có lỗi khi tra từ điển, thử lại sau.");
    } finally {
      setIsLookingUp(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createWord(formData);
      setFields((f) => ({ ...emptyFields, lessonId: f.lessonId }));
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="font-semibold text-slate-900">Thêm từ mới</h2>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="term">
          Từ vựng
        </label>
        <div className="flex gap-2">
          <input
            id="term"
            name="term"
            value={fields.term}
            onChange={(e) => setFields((f) => ({ ...f, term: e.target.value }))}
            placeholder="vd: apple"
            required
            className={`flex-1 ${inputClass}`}
          />
          <button
            type="button"
            onClick={handleAutoFill}
            disabled={isLookingUp || !fields.term.trim()}
            className="shrink-0 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
          >
            {isLookingUp ? "Đang tra..." : "✨ Tự động điền"}
          </button>
        </div>
        {lookupError && <p className="text-sm text-red-600">{lookupError}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="meaning">
          Nghĩa tiếng Việt
        </label>
        <input
          id="meaning"
          name="meaning"
          value={fields.meaning}
          onChange={(e) => setFields((f) => ({ ...f, meaning: e.target.value }))}
          placeholder="vd: quả táo"
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="ipa">
          Phiên âm IPA
        </label>
        <input
          id="ipa"
          name="ipa"
          value={fields.ipa}
          onChange={(e) => setFields((f) => ({ ...f, ipa: e.target.value }))}
          placeholder="vd: ˈæp.əl"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="example">
          Câu ví dụ (tiếng Anh)
        </label>
        <textarea
          id="example"
          name="example"
          value={fields.example}
          onChange={(e) => setFields((f) => ({ ...f, example: e.target.value }))}
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="exampleTranslation">
          Dịch nghĩa câu ví dụ
        </label>
        <textarea
          id="exampleTranslation"
          name="exampleTranslation"
          value={fields.exampleTranslation}
          onChange={(e) =>
            setFields((f) => ({ ...f, exampleTranslation: e.target.value }))
          }
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="lessonId">
          Thuộc Bài
        </label>
        <select
          id="lessonId"
          name="lessonId"
          value={fields.lessonId}
          onChange={(e) =>
            setFields((f) => ({ ...f, lessonId: e.target.value }))
          }
          className={inputClass}
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
        disabled={isPending}
        className="self-start rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
      >
        Thêm từ
      </button>
    </form>
  );
}
