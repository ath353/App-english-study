import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WordForm } from "@/components/WordForm";
import { WordList } from "@/components/WordList";

export default async function WordsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const words = await prisma.word.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Từ vựng của tôi</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/review" className="text-blue-600 hover:underline">
            Ôn tập
          </Link>
          <Link href="/" className="text-blue-600 hover:underline">
            Về trang chủ
          </Link>
        </div>
      </div>
      <WordForm />
      <WordList words={words} />
    </main>
  );
}
