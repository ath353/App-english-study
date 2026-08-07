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

function readWordFields(formData: FormData) {
  const term = String(formData.get("term") ?? "").trim();
  const meaning = String(formData.get("meaning") ?? "").trim();
  const ipa = String(formData.get("ipa") ?? "").trim();
  const example = String(formData.get("example") ?? "").trim();
  const exampleTranslation = String(
    formData.get("exampleTranslation") ?? "",
  ).trim();
  const lessonId = String(formData.get("lessonId") ?? "").trim();
  return {
    term,
    meaning,
    ipa: ipa || null,
    example: example || null,
    exampleTranslation: exampleTranslation || null,
    lessonId: lessonId || null,
  };
}

export async function createWord(formData: FormData) {
  const userId = await requireUserId();
  const { term, meaning, ipa, example, exampleTranslation, lessonId } =
    readWordFields(formData);
  if (!term || !meaning) return;

  const safeLessonId = await resolveLessonId(userId, lessonId);

  await prisma.word.create({
    data: {
      userId,
      term,
      meaning,
      ipa,
      example,
      exampleTranslation,
      lessonId: safeLessonId,
    },
  });

  revalidatePath("/words");
}

export async function updateWord(id: string, formData: FormData) {
  const userId = await requireUserId();
  const { term, meaning, ipa, example, exampleTranslation, lessonId } =
    readWordFields(formData);
  if (!term || !meaning) return;

  const safeLessonId = await resolveLessonId(userId, lessonId);

  await prisma.word.updateMany({
    where: { id, userId },
    data: {
      term,
      meaning,
      ipa,
      example,
      exampleTranslation,
      lessonId: safeLessonId,
    },
  });

  revalidatePath("/words");
}

export async function bulkCreateWords(formData: FormData) {
  const userId = await requireUserId();
  const rawTerms = String(formData.get("terms") ?? "");
  const rawLessonId = String(formData.get("lessonId") ?? "").trim() || null;

  const terms = rawTerms
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

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

const STATUS_ORDER = ["NEW", "LEARNING", "KNOWN"] as const;

export async function reviewWord(id: string, remembered: boolean) {
  const userId = await requireUserId();
  const word = await prisma.word.findFirst({ where: { id, userId } });
  if (!word) return;

  const newStatus = remembered
    ? STATUS_ORDER[
        Math.min(
          STATUS_ORDER.indexOf(word.status) + 1,
          STATUS_ORDER.length - 1,
        )
      ]
    : "NEW";

  await prisma.word.update({
    where: { id },
    data: { status: newStatus, lastReviewedAt: new Date() },
  });

  revalidatePath("/review");
  revalidatePath("/words");
}
