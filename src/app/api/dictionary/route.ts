import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { lookupWord } from "@/lib/dictionary";
import { rateLimit } from "@/lib/rateLimit";

// Mỗi người tối đa 20 lần tra trong 1 phút — đủ dùng bình thường, chặn spam.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

export async function GET(request: NextRequest) {
  // Chỉ người đã đăng nhập mới được dùng — tránh bị lạm dụng làm proxy dịch miễn phí
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const gate = rateLimit(
    `dictionary:${session.user.id}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Bạn tra từ hơi nhanh, nghỉ một chút rồi thử lại nhé." },
      {
        status: 429,
        headers: { "Retry-After": String(gate.retryAfterSec) },
      },
    );
  }

  const word = request.nextUrl.searchParams.get("word") ?? "";
  const outcome = await lookupWord(word);

  if (!outcome.ok) {
    return NextResponse.json(
      { error: outcome.error },
      { status: outcome.status },
    );
  }

  return NextResponse.json(outcome.data);
}
