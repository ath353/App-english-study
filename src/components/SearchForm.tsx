"use client";

import { useRouter } from "next/navigation";

export function SearchForm({
  defaultQuery,
  lessonId,
  status,
  sort,
}: {
  defaultQuery: string;
  lessonId?: string;
  status?: string;
  sort?: string;
}) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = String(formData.get("q") ?? "").trim();

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (lessonId) params.set("lesson", lessonId);
    if (status) params.set("status", status);
    if (sort) params.set("sort", sort);

    const qs = params.toString();
    router.push(qs ? `/words?${qs}` : "/words", { scroll: false });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl gap-2">
      <input
        type="text"
        name="q"
        defaultValue={defaultQuery}
        placeholder="Tìm theo từ hoặc nghĩa..."
        className="flex-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <button
        type="submit"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Tìm
      </button>
    </form>
  );
}
