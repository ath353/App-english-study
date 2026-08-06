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

export async function createLesson(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.lesson.create({
    data: { userId, name },
  });

  revalidatePath("/words");
  revalidatePath("/review");
}

export async function deleteLesson(id: string) {
  const userId = await requireUserId();
  await prisma.lesson.deleteMany({ where: { id, userId } });

  revalidatePath("/words");
  revalidatePath("/review");
}
