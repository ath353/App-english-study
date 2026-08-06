import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FlashcardReview } from "@/components/FlashcardReview";

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const words = await prisma.word.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ôn tập từ vựng</h1>
        <Link href="/words" className="text-sm text-blue-600 hover:underline">
          Quản lý từ vựng
        </Link>
      </div>
      <FlashcardReview words={words} />
    </main>
  );
}
