-- AlterTable
ALTER TABLE "Word" ADD COLUMN     "lessonId" TEXT;

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lesson_userId_idx" ON "Lesson"("userId");

-- CreateIndex
CREATE INDEX "Word_lessonId_idx" ON "Word"("lessonId");

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
