import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUS_LABEL: Record<string, string> = {
  NEW: "Mới",
  LEARNING: "Đang học",
  KNOWN: "Đã thuộc",
};

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

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

  const header = [
    "Từ vựng",
    "Nghĩa",
    "Phiên âm IPA",
    "Câu ví dụ",
    "Dịch câu ví dụ",
    "Bài học",
    "Trạng thái",
    "Ngày thêm",
  ];

  const rows = words.map((w) =>
    [
      w.term,
      w.meaning ?? "",
      w.ipa ?? "",
      w.example ?? "",
      w.exampleTranslation ?? "",
      w.lesson?.name ?? "",
      STATUS_LABEL[w.status] ?? w.status,
      w.createdAt.toISOString().slice(0, 10),
    ]
      .map((v) => csvEscape(String(v)))
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\r\n");
  // Thêm BOM để Excel nhận đúng chữ tiếng Việt (UTF-8)
  const csvWithBom = "﻿" + csv;

  const filename = `english-study-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csvWithBom, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
