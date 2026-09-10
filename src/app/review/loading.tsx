import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="mx-auto h-60 w-full max-w-md rounded-3xl" />
      <Skeleton className="mx-auto h-10 w-28 rounded-full" />
    </main>
  );
}
