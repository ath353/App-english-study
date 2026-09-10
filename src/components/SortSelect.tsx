"use client";

import { useRouter } from "next/navigation";

const OPTIONS = [
  { value: "new", label: "Mới nhất" },
  { value: "az", label: "A → Z" },
  { value: "due", label: "Sắp đến hạn ôn" },
];

export function SortSelect({
  value,
  q,
  lessonId,
  status,
}: {
  value: string;
  q?: string;
  lessonId?: string;
  status?: string;
}) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (lessonId) params.set("lesson", lessonId);
    if (status) params.set("status", status);
    if (e.target.value !== "new") params.set("sort", e.target.value);
    const qs = params.toString();
    router.push(qs ? `/words?${qs}` : "/words", { scroll: false });
  }

  return (
    <label className="flex items-center gap-1.5 text-sm text-muted">
      Sắp xếp
      <select
        value={value}
        onChange={handleChange}
        className="rounded-lg border border-line bg-surface px-2 py-1 text-sm text-fg-soft focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
