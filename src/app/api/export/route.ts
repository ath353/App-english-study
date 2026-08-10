import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const words = await prisma.word.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: { lesson: { select: { name: true } } },
  });

  const data = words.map((w) => ({
    term: w.term,
    meaning: w.meaning,
    ipa: w.ipa,
    example: w.example,
    exampleTranslation: w.exampleTranslation,
    lesson: w.lesson?.name ?? null,
    status: w.status,
    createdAt: w.createdAt,
  }));

  const json = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      totalWords: data.length,
      words: data,
    },
    null,
    2,
  );

  const filename = `english-study-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
