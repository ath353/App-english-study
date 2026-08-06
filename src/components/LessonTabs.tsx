import Link from "next/link";

type Lesson = {
  id: string;
  name: string;
  _count: { words: number };
};

export function LessonTabs({
  lessons,
  activeLessonId,
  basePath,
  totalCount,
  extraParams = {},
}: {
  lessons: Lesson[];
  activeLessonId?: string;
  basePath: string;
  totalCount: number;
  extraParams?: Record<string, string>;
}) {
  function buildHref(lessonId?: string) {
    const params = new URLSearchParams(extraParams);
    if (lessonId) params.set("lesson", lessonId);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  function pillClass(active: boolean) {
    return `rounded-full px-3 py-1.5 text-sm font-medium ${
      active
        ? "bg-indigo-600 text-white"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`;
  }

  if (lessons.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={buildHref(undefined)}
        scroll={false}
        className={pillClass(!activeLessonId)}
      >
        Tất cả ({totalCount})
      </Link>
      {lessons.map((lesson) => (
        <Link
          key={lesson.id}
          href={buildHref(lesson.id)}
          scroll={false}
          className={pillClass(activeLessonId === lesson.id)}
        >
          {lesson.name} ({lesson._count.words})
        </Link>
      ))}
    </div>
  );
}
