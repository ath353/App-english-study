// Bộ giới hạn tần suất đơn giản, lưu ngay trong bộ nhớ tiến trình.
//
// Lưu ý: trên môi trường serverless (Vercel), mỗi instance có bộ đếm riêng và
// sẽ mất khi instance ngủ. Vì vậy đây chỉ là lớp chặn lạm dụng cơ bản, không
// phải giới hạn tuyệt đối. Nếu sau này cần chính xác, chuyển sang dùng Redis
// (ví dụ Upstash).

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Dọn các mục đã hết hạn để Map không phình vô hạn.
function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();

  if (buckets.size > 500) sweep(now);

  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSec: 0 };
}
