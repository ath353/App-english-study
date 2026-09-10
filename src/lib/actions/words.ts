"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Chưa đăng nhập");
  }
  return session.user.id;
}

// Xác nhận lessonId (nếu có) thực sự thuộc về user này — tránh lỗi vi phạm
// khoá ngoại khi Bài đã bị xoá ở nơi khác, và tránh gán nhầm vào Bài của người khác.
async function resolveLessonId(userId: string, lessonId: string | null) {
  if (!lessonId) return null;
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, userId },
    select: { id: true },
  });
  return lesson ? lesson.id : null;
}

// Kết quả trả về cho form: có lỗi thì kèm thông báo để hiển thị, không có lỗi
// nghĩa là lưu thành công.
export type WordActionResult = { error: string } | undefined;

// Giới hạn độ dài từng ô nhập (số ký tự) — chặn dữ liệu bất thường quá lớn.
const FIELD_LIMITS = {
  term: 100,
  meaning: 500,
  ipa: 100,
  example: 1000,
  definitionEn: 1000,
} as const;

function readWordFields(formData: FormData) {
  const term = String(formData.get("term") ?? "").trim();
  const meaning = String(formData.get("meaning") ?? "").trim();
  const ipa = String(formData.get("ipa") ?? "").trim();
  const example = String(formData.get("example") ?? "").trim();
  const definitionEn = String(formData.get("definitionEn") ?? "").trim();
  const lessonId = String(formData.get("lessonId") ?? "").trim();
  return {
    term,
    meaning,
    ipa: ipa || null,
    example: example || null,
    definitionEn: definitionEn || null,
    lessonId: lessonId || null,
  };
}

// Kiểm tra dữ liệu form. Trả về thông báo lỗi (string) nếu sai, null nếu hợp lệ.
function validateWordFields(
  fields: ReturnType<typeof readWordFields>,
): string | null {
  if (!fields.term || !fields.meaning) {
    return "Cần nhập cả từ vựng lẫn nghĩa.";
  }
  const tooLong: [string, string | null, number][] = [
    ["Từ vựng", fields.term, FIELD_LIMITS.term],
    ["Nghĩa", fields.meaning, FIELD_LIMITS.meaning],
    ["Phiên âm", fields.ipa, FIELD_LIMITS.ipa],
    ["Câu ví dụ", fields.example, FIELD_LIMITS.example],
    ["Định nghĩa tiếng Anh", fields.definitionEn, FIELD_LIMITS.definitionEn],
  ];
  for (const [label, value, limit] of tooLong) {
    if (value && value.length > limit) {
      return `${label} không được dài quá ${limit} ký tự.`;
    }
  }
  return null;
}

// Kiểm tra user đã có từ này chưa (không phân biệt hoa/thường). excludeId để bỏ
// qua chính từ đang được sửa.
async function isDuplicateTerm(
  userId: string,
  term: string,
  excludeId?: string,
) {
  const found = await prisma.word.findFirst({
    where: {
      userId,
      term: { equals: term, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  return found !== null;
}

export async function createWord(
  formData: FormData,
): Promise<WordActionResult> {
  const userId = await requireUserId();
  const fields = readWordFields(formData);

  const error = validateWordFields(fields);
  if (error) return { error };

  if (await isDuplicateTerm(userId, fields.term)) {
    return { error: `Từ "${fields.term}" đã có trong danh sách rồi.` };
  }

  const { term, meaning, ipa, example, definitionEn, lessonId } = fields;
  const safeLessonId = await resolveLessonId(userId, lessonId);

  await prisma.word.create({
    data: {
      userId,
      term,
      meaning,
      ipa,
      example,
      definitionEn,
      lessonId: safeLessonId,
    },
  });

  revalidatePath("/words");
}

export async function updateWord(
  id: string,
  formData: FormData,
): Promise<WordActionResult> {
  const userId = await requireUserId();
  const fields = readWordFields(formData);

  const error = validateWordFields(fields);
  if (error) return { error };

  if (await isDuplicateTerm(userId, fields.term, id)) {
    return { error: `Đã có từ "${fields.term}" khác trong danh sách.` };
  }

  const { term, meaning, ipa, example, definitionEn, lessonId } = fields;
  const safeLessonId = await resolveLessonId(userId, lessonId);

  await prisma.word.updateMany({
    where: { id, userId },
    data: {
      term,
      meaning,
      ipa,
      example,
      definitionEn,
      lessonId: safeLessonId,
    },
  });

  revalidatePath("/words");
}

// Giới hạn số từ cho mỗi lần nhập hàng loạt — tránh dán nhầm hàng chục nghìn dòng
// làm phình database hoặc quá thời gian xử lý. Cần nhiều hơn thì chia làm nhiều lần.
const MAX_BULK_TERMS = 300;
const MAX_TERM_LENGTH = 100;

export async function bulkCreateWords(formData: FormData) {
  const userId = await requireUserId();
  const rawTerms = String(formData.get("terms") ?? "");
  const rawLessonId = String(formData.get("lessonId") ?? "").trim() || null;

  const lines = rawTerms
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.length <= MAX_TERM_LENGTH);

  if (lines.length > MAX_BULK_TERMS) {
    throw new Error(
      `Mỗi lần chỉ nhập tối đa ${MAX_BULK_TERMS} từ. Bạn đang có ${lines.length} dòng — hãy chia nhỏ ra.`,
    );
  }

  // Bỏ trùng lặp ngay trong danh sách vừa dán (không phân biệt hoa/thường)
  const seen = new Set<string>();
  const uniqueLines = lines.filter((line) => {
    const key = line.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Bỏ tiếp những từ user đã có sẵn trong danh sách
  const existing = await prisma.word.findMany({
    where: { userId },
    select: { term: true },
  });
  const existingKeys = new Set(existing.map((w) => w.term.toLowerCase()));
  const terms = uniqueLines.filter(
    (line) => !existingKeys.has(line.toLowerCase()),
  );

  const lessonId = await resolveLessonId(userId, rawLessonId);

  if (terms.length > 0) {
    await prisma.word.createMany({
      data: terms.map((term) => ({ userId, term, lessonId })),
    });
  }

  revalidatePath("/words");
  redirect(`/words${lessonId ? `?lesson=${lessonId}` : ""}`);
}

export async function deleteWord(id: string) {
  const userId = await requireUserId();
  await prisma.word.deleteMany({ where: { id, userId } });
  revalidatePath("/words");
}

export async function deleteWords(ids: string[]) {
  const userId = await requireUserId();
  const cleanIds = ids.filter((id) => typeof id === "string" && id.length > 0);
  if (cleanIds.length === 0) return;

  await prisma.word.deleteMany({ where: { id: { in: cleanIds }, userId } });
  revalidatePath("/words");
}

// Lịch ôn tập kiểu Leitner. Mỗi từ ở một "hộp" 1..5; nhớ thì lên hộp, quên thì
// về hộp 1. Số ngày chờ tới lần ôn kế tiếp theo từng hộp:
const MAX_BOX = 5;
const BOX_INTERVAL_DAYS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

function boxToStatus(box: number): "NEW" | "LEARNING" | "KNOWN" {
  if (box <= 1) return "NEW";
  if (box <= 3) return "LEARNING";
  return "KNOWN";
}

// Ngày đến hạn = 0h sáng, cách hôm nay `days` ngày. Dùng 0h để một từ hẹn
// "ngày mai" là đến hạn ngay từ đầu ngày mai, không phải đúng giờ này ngày mai.
function dueDateAfterDays(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

export async function reviewWord(id: string, remembered: boolean) {
  const userId = await requireUserId();
  const word = await prisma.word.findFirst({
    where: { id, userId },
    select: { box: true },
  });
  if (!word) return;

  const newBox = remembered ? Math.min(word.box + 1, MAX_BOX) : 1;

  await prisma.word.updateMany({
    where: { id, userId },
    data: {
      box: newBox,
      status: boxToStatus(newBox),
      dueAt: dueDateAfterDays(BOX_INTERVAL_DAYS[newBox]),
      lastReviewedAt: new Date(),
    },
  });

  revalidatePath("/review");
  revalidatePath("/words");
  revalidatePath("/");
}
