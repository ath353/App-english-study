import type { NextConfig } from "next";

// Các header bảo mật cơ bản, áp cho mọi đường dẫn. Đây là loại "an toàn tuyệt đối,
// không phá vỡ gì". Content-Security-Policy (CSP) mạnh hơn nhưng cần thiết lập
// nonce qua proxy nên để làm sau.
const securityHeaders = [
  // Chặn trang bị nhúng vào iframe của web khác (chống clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Trình duyệt không được "đoán" kiểu file khác với Content-Type khai báo
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Không gửi kèm đường dẫn đầy đủ khi chuyển sang trang web khác
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Ép trình duyệt luôn dùng HTTPS trong 1 năm
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Tắt sẵn các quyền thiết bị mà app không dùng
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
