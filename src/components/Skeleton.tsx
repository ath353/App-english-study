// Ô xám nhấp nháy dùng làm khung xương trong lúc chờ trang tải.
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface-2 ${className}`}
    />
  );
}
