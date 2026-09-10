-- Thêm lịch ôn tập kiểu Leitner cho từ vựng.

-- Cột mới: hộp hiện tại (1..5) và ngày đến hạn ôn tiếp theo.
ALTER TABLE "Word" ADD COLUMN "box" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Word" ADD COLUMN "dueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Giữ tiến độ hiện có: suy ra hộp ban đầu từ trạng thái.
UPDATE "Word" SET "box" = 2 WHERE "status" = 'LEARNING';
UPDATE "Word" SET "box" = 4 WHERE "status" = 'KNOWN';

-- Từ đã thuộc thì chưa cần ôn gấp — hẹn lại sau 3 ngày để buổi ôn đầu tiên đỡ ngợp.
UPDATE "Word"
SET "dueAt" = CURRENT_TIMESTAMP + INTERVAL '3 days'
WHERE "status" = 'KNOWN';

-- Chỉ mục hỗ trợ truy vấn "các từ đến hạn ôn của một người".
CREATE INDEX "Word_userId_dueAt_idx" ON "Word"("userId", "dueAt");
