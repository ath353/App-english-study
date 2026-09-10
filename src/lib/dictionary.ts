// Tra một từ tiếng Anh từ các dịch vụ miễn phí:
// - Free Dictionary API (dictionaryapi.dev): phiên âm, câu ví dụ, định nghĩa, loại từ
// - MyMemory: dịch từ và câu ví dụ sang tiếng Việt
//
// Dùng chung cho route /api/dictionary (nút "Tự động điền" trên form) và cho
// server action điền hàng loạt.

// Thời gian chờ tối đa cho mỗi lần gọi API bên ngoài (ms).
const EXTERNAL_TIMEOUT = 6000;

type DictionaryDefinition = { definition?: string; example?: string };
type DictionaryMeaning = {
  partOfSpeech?: string;
  definitions?: DictionaryDefinition[];
};
type DictionaryEntry = {
  word?: string;
  phonetic?: string;
  phonetics?: { text?: string }[];
  meanings?: DictionaryMeaning[];
};

export type LookupResult = {
  term: string;
  ipa: string;
  meaning: string;
  example: string; // gộp sẵn dạng "câu tiếng Anh / bản dịch tiếng Việt"
  definitionEn: string;
};

export type LookupOutcome =
  | { ok: true; data: LookupResult }
  | { ok: false; status: number; error: string };

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
    // MyMemory trả text cảnh báo (không phải bản dịch) khi hết lượt miễn phí trong ngày
    if (translated.toUpperCase().includes("MYMEMORY WARNING")) return "";
    return translated;
  } catch {
    return "";
  }
}

export async function lookupWord(rawWord: string): Promise<LookupOutcome> {
  const word = rawWord.trim();
  if (!word) return { ok: false, status: 400, error: "Thiếu từ cần tra" };
  if (word.length > 100)
    return { ok: false, status: 400, error: "Từ cần tra quá dài" };

  let res: Response;
  try {
    res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { signal: AbortSignal.timeout(EXTERNAL_TIMEOUT) },
    );
  } catch {
    return {
      ok: false,
      status: 504,
      error: "Từ điển phản hồi chậm, thử lại sau hoặc tự nhập.",
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      status: 404,
      error: "Không tìm thấy từ này trong từ điển, bạn có thể tự nhập.",
    };
  }

  let data: DictionaryEntry[];
  try {
    data = await res.json();
  } catch {
    return {
      ok: false,
      status: 502,
      error: "Không đọc được dữ liệu từ điển, bạn có thể tự nhập.",
    };
  }
  const entry = data[0];

  const ipa =
    entry?.phonetic || entry?.phonetics?.find((p) => p.text)?.text || "";

  let example = "";
  const defParts: string[] = [];
  for (const m of entry?.meanings ?? []) {
    const firstDef = m.definitions?.find((d) => d.definition)?.definition;
    if (firstDef && defParts.length < 2) {
      const pos = m.partOfSpeech ? `(${m.partOfSpeech}) ` : "";
      defParts.push(`${pos}${firstDef}`);
    }
    for (const d of m.definitions ?? []) {
      if (!example && d.example) example = d.example;
      if (example) break;
    }
    if (example && defParts.length >= 2) break;
  }
  const definitionEn = defParts.join("; ");

  const [meaning, exampleTranslation] = await Promise.all([
    translateToVietnamese(word),
    translateToVietnamese(example),
  ]);

  const exampleCombined =
    example && exampleTranslation
      ? `${example} / ${exampleTranslation}`
      : example;

  return {
    ok: true,
    data: {
      term: entry?.word ?? word,
      ipa: ipa.replace(/^\/|\/$/g, ""),
      meaning,
      example: exampleCombined,
      definitionEn,
    },
  };
}
