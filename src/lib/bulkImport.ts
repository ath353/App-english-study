// Đọc từng dòng trong ô "Nhập hàng loạt". Mỗi dòng có thể là:
//   - chỉ 1 từ:            apple
//   - đầy đủ, ngăn bởi |:  từ | nghĩa | IPA | loại từ | câu ví dụ
// Các cột phía sau có thể bỏ trống hoặc bỏ hẳn. Ghi "-" cũng tính là trống.

export const BULK_FIELD_LIMITS = {
  term: 100,
  meaning: 500,
  ipa: 100,
  definitionEn: 1000,
  example: 1000,
} as const;

export type BulkRow = {
  term: string;
  meaning: string | null;
  ipa: string | null;
  definitionEn: string | null;
  example: string | null;
};

function cell(value: string | undefined, limit: number): string | null {
  const v = (value ?? "").trim();
  if (!v || v === "-") return null;
  return v.slice(0, limit);
}

// AI hay ghi phiên âm kèm dấu /.../ hoặc [...] — bỏ đi vì giao diện tự thêm /.../.
function cleanIpa(value: string | null): string | null {
  if (!value) return null;
  const v = value.replace(/^[/[\s]+|[/\]\s]+$/g, "");
  return v || null;
}

// Trả về null nếu dòng không dùng được (trống, quá dài, dòng kẻ bảng...).
export function parseBulkLine(rawLine: string): BulkRow | null {
  let line = rawLine.trim();
  if (!line || line.startsWith("```")) return null;

  // Phòng khi AI xuất dạng bảng markdown: "| apple | quả táo |"
  if (line.startsWith("|")) line = line.slice(1);
  if (line.endsWith("|")) line = line.slice(0, -1);

  const parts = line.split("|");
  const term = parts[0].trim();
  if (!term || term.length > BULK_FIELD_LIMITS.term) return null;
  // Dòng kẻ của bảng markdown, vd "---|---|---"
  if (/^[-:\s]+$/.test(term)) return null;

  // Nếu lỡ có nhiều hơn 5 cột thì phần dư gộp vào câu ví dụ.
  const example = parts.length > 4 ? parts.slice(4).join("|") : undefined;

  return {
    term,
    meaning: cell(parts[1], BULK_FIELD_LIMITS.meaning),
    ipa: cleanIpa(cell(parts[2], BULK_FIELD_LIMITS.ipa)),
    definitionEn: cell(parts[3], BULK_FIELD_LIMITS.definitionEn),
    example: cell(example, BULK_FIELD_LIMITS.example),
  };
}
