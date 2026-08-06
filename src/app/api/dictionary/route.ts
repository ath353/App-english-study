import { NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
  const word = request.nextUrl.searchParams.get("word")?.trim();

  if (!word) {
    return NextResponse.json({ error: "Thiếu từ cần tra" }, { status: 400 });
  }

  const res = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Không tìm thấy từ này trong từ điển, bạn có thể tự nhập." },
      { status: 404 },
    );
  }

  const data: DictionaryEntry[] = await res.json();
  const entry = data[0];

  const ipa =
    entry?.phonetic || entry?.phonetics?.find((p) => p.text)?.text || "";

  let meaning = "";
  let example = "";
  for (const m of entry?.meanings ?? []) {
    for (const d of m.definitions ?? []) {
      if (!meaning && d.definition) meaning = d.definition;
      if (!example && d.example) example = d.example;
      if (meaning && example) break;
    }
    if (meaning && example) break;
  }

  return NextResponse.json({
    term: entry?.word ?? word,
    ipa: ipa.replace(/^\/|\/$/g, ""),
    meaning,
    example,
  });
}
