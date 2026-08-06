"use client";

import { useState, useTransition } from "react";

import { createWord } from "@/lib/actions/words";

const emptyFields = {
  term: "",
  meaning: "",
  ipa: "",
  example: "",
  exampleTranslation: "",
};

export function WordForm() {
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
      setFields(emptyFields);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-md border border-gray-300 p-4"
    >
      <div className="flex gap-2">
        <input
          name="term"
          value={fields.term}
          onChange={(e) => setFields((f) => ({ ...f, term: e.target.value }))}
          placeholder="Từ vựng (vd: apple)"
          required
          className="flex-1 rounded border border-gray-300 px-3 py-2"
        />
        <button
          type="button"
          onClick={handleAutoFill}
          disabled={isLookingUp || !fields.term.trim()}
          className="shrink-0 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLookingUp ? "Đang tra..." : "Tự động điền"}
        </button>
      </div>

      {lookupError && <p className="text-sm text-red-600">{lookupError}</p>}

      <input
        name="meaning"
        value={fields.meaning}
        onChange={(e) => setFields((f) => ({ ...f, meaning: e.target.value }))}
        placeholder="Nghĩa tiếng Việt (vd: quả táo)"
        required
        className="rounded border border-gray-300 px-3 py-2"
      />
      <input
        name="ipa"
        value={fields.ipa}
        onChange={(e) => setFields((f) => ({ ...f, ipa: e.target.value }))}
        placeholder="Phiên âm IPA (vd: ˈæp.əl)"
        className="rounded border border-gray-300 px-3 py-2"
      />
      <textarea
        name="example"
        value={fields.example}
        onChange={(e) => setFields((f) => ({ ...f, example: e.target.value }))}
        placeholder="Câu ví dụ (tiếng Anh)"
        rows={2}
        className="rounded border border-gray-300 px-3 py-2"
      />
      <textarea
        name="exampleTranslation"
        value={fields.exampleTranslation}
        onChange={(e) =>
          setFields((f) => ({ ...f, exampleTranslation: e.target.value }))
        }
        placeholder="Dịch nghĩa câu ví dụ (tiếng Việt)"
        rows={2}
        className="rounded border border-gray-300 px-3 py-2"
      />

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        Thêm từ
      </button>
    </form>
  );
}
