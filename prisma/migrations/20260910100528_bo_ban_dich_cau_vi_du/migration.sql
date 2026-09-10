-- Gộp bản dịch câu ví dụ vào chính cột "example" rồi xoá cột "exampleTranslation".

-- 1. Có cả câu ví dụ lẫn bản dịch -> nối bằng " / "
UPDATE "Word"
SET "example" = "example" || ' / ' || "exampleTranslation"
WHERE "exampleTranslation" IS NOT NULL
  AND "exampleTranslation" <> ''
  AND "example" IS NOT NULL
  AND "example" <> '';

-- 2. Chỉ có bản dịch, chưa có câu ví dụ -> lấy nguyên bản dịch
UPDATE "Word"
SET "example" = "exampleTranslation"
WHERE "exampleTranslation" IS NOT NULL
  AND "exampleTranslation" <> ''
  AND ("example" IS NULL OR "example" = '');

-- 3. Xoá cột không còn dùng
ALTER TABLE "Word" DROP COLUMN "exampleTranslation";
