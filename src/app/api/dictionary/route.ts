import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

// Thời gian chờ tối đa cho mỗi lần gọi API bên ngoài (ms). Quá hạn thì bỏ qua,
// tránh để request của người dùng bị treo khi dịch vụ ngoài phản hồi chậm.
const EXTERNAL_TIMEOUT = 6000;

// Mỗi người tối đa 20 lần tra trong 1 phút — đủ dùng bình thường, chặn spam.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

type DictionaryDefinition = {
  definition?: string;
  example?: string;
};

type DictionaryMeaning = {
  definitions?: DictionaryDefinition[];
};

type DictionaryEntry = {
  word?: string;
  phonetic?: string;
  phonetics?: { text?: string }[];
  meanings?: DictionaryMeaning[];
};

async function translateToVietnamese(text: string): Promise<string> {
  if (!text) return "";

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`,
      { signal: AbortSignal.timeout(EXTERNAL_TIMEOUT) },
    );
    if (!res.ok) return "";

    const data = await res.json();
    const translated: string = data?.responseData?.translatedText ?? "";

    // MyMemory trả về text cảnh báo (không phải bản dịch) khi hết lượt miễn phí trong ngày
    if (translated.toUpperCase().includes("MYMEMORY WARNING")) return "";

    return translated;
  } catch {
    return "";
  }
}

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

  const word = request.nextUrl.searchParams.get("word")?.trim();

  if (!word) {
    return NextResponse.json({ error: "Thiếu từ cần tra" }, { status: 400 });
  }
  if (word.length > 100) {
    return NextResponse.json({ error: "Từ cần tra quá dài" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { signal: AbortSignal.timeout(EXTERNAL_TIMEOUT) },
    );
  } catch {
    return NextResponse.json(
      { error: "Từ điển phản hồi chậm, thử lại sau hoặc tự nhập." },
      { status: 504 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: "Không tìm thấy từ này trong từ điển, bạn có thể tự nhập." },
      { status: 404 },
    );
  }

  let data: DictionaryEntry[];
  try {
    data = await res.json();
  } catch {
    return NextResponse.json(
      { error: "Không đọc được dữ liệu từ điển, bạn có thể tự nhập." },
      { status: 502 },
    );
  }
  const entry = data[0];

  const ipa =
    entry?.phonetic || entry?.phonetics?.find((p) => p.text)?.text || "";

  let example = "";
  for (const m of entry?.meanings ?? []) {
    for (const d of m.definitions ?? []) {
      if (!example && d.example) example = d.example;
      if (example) break;
    }
    if (example) break;
  }

  const [meaning, exampleTranslation] = await Promise.all([
    translateToVietnamese(word),
    translateToVietnamese(example),
  ]);

  // Gộp câu ví dụ tiếng Anh và bản dịch tiếng Việt vào một chuỗi: "Anh / Việt"
  const exampleCombined =
    example && exampleTranslation
      ? `${example} / ${exampleTranslation}`
      : example;

  return NextResponse.json({
    term: entry?.word ?? word,
    ipa: ipa.replace(/^\/|\/$/g, ""),
    meaning,
    example: exampleCombined,
  });
}
