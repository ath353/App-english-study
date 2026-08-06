"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Chưa đăng nhập");
  }
  return session.user.id;
}

function readWordFields(formData: FormData) {
  const term = String(formData.get("term") ?? "").trim();
  const meaning = String(formData.get("meaning") ?? "").trim();
  const ipa = String(formData.get("ipa") ?? "").trim();
  const example = String(formData.get("example") ?? "").trim();
  const exampleTranslation = String(
    formData.get("exampleTranslation") ?? "",
  ).trim();
  return {
    term,
    meaning,
    ipa: ipa || null,
    example: example || null,
    exampleTranslation: exampleTranslation || null,
  };
}

export async function createWord(formData: FormData) {
  const userId = await requireUserId();
  const { term, meaning, ipa, example, exampleTranslation } =
    readWordFields(formData);
  if (!term || !meaning) return;

  await prisma.word.create({
    data: { userId, term, meaning, ipa, example, exampleTranslation },
  });

  revalidatePath("/words");
}

export async function updateWord(id: string, formData: FormData) {
  const userId = await requireUserId();
  const { term, meaning, ipa, example, exampleTranslation } =
    readWordFields(formData);
  if (!term || !meaning) return;

  await prisma.word.updateMany({
    where: { id, userId },
    data: { term, meaning, ipa, example, exampleTranslation },
  });

  revalidatePath("/words");
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
