# 📚 English-Study

Ứng dụng học từ vựng tiếng Anh cá nhân — thêm từ tự do (không theo lộ trình có sẵn), tổ chức theo Bài học, ôn tập bằng flashcard. Chạy được trên cả web lẫn điện thoại, cài được như app thật (PWA).

🔗 **Link dùng thử:** https://app-english-study.vercel.app

## Tính năng

- Đăng nhập bằng Google — dữ liệu tách riêng theo từng tài khoản
- Thêm từ vựng, tự động điền nghĩa / phiên âm IPA / câu ví dụ (qua Free Dictionary API) và tự động dịch sang tiếng Việt (qua MyMemory API)
- Nhập hàng loạt: dán danh sách nhiều từ cùng lúc, bổ sung nghĩa sau
- Tổ chức từ vựng theo **Bài học**, lọc và ôn tập riêng từng Bài
- Ôn tập bằng flashcard — lật thẻ, tự đánh giá Nhớ / Chưa nhớ
- Tìm kiếm, phân trang danh sách từ vựng
- Chọn nhiều từ để xoá hàng loạt
- Cài lên màn hình chính điện thoại, dùng như app thật (PWA)

## Công nghệ sử dụng

| Hạng mục | Công nghệ |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, TypeScript) |
| Giao diện | [Tailwind CSS](https://tailwindcss.com) |
| Database | PostgreSQL ([Neon](https://neon.tech), serverless) |
| ORM | [Prisma](https://www.prisma.io) |
| Đăng nhập | [Auth.js](https://authjs.dev) + Google OAuth |
| Hosting | [Vercel](https://vercel.com) |

## Chạy trên máy (development)

### 1. Cài đặt gói phụ thuộc

```bash
npm install
```

### 2. Tạo file `.env` ở thư mục gốc

```
DATABASE_URL=         # connection string PostgreSQL (khuyến nghị dùng bản "pooled" của Neon)
AUTH_SECRET=           # chuỗi bí mật ngẫu nhiên, dùng để mã hoá session
AUTH_GOOGLE_ID=        # Client ID từ Google Cloud Console (OAuth)
AUTH_GOOGLE_SECRET=    # Client Secret tương ứng
```

### 3. Khởi tạo database

```bash
npx prisma migrate dev
```

### 4. Chạy server phát triển

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Các lệnh có sẵn

| Lệnh | Chức năng |
|---|---|
| `npm run dev` | Chạy server phát triển (dev) |
| `npm run build` | Build bản production |
| `npm run start` | Chạy bản đã build |
| `npm run lint` | Kiểm tra lỗi code (ESLint) |

## Cấu trúc thư mục chính

```
src/
├── app/
│   ├── words/            # Danh sách, thêm, sửa, nhập hàng loạt từ vựng
│   ├── review/            # Trang ôn tập flashcard
│   └── api/
│       └── dictionary/    # API tra từ điển + dịch nghĩa
├── components/            # React components dùng chung
└── lib/
    ├── actions/           # Server Actions (thêm/sửa/xoá dữ liệu)
    ├── auth.ts            # Cấu hình đăng nhập
    └── prisma.ts          # Kết nối database

prisma/
└── schema.prisma          # Cấu trúc database (User, Word, Lesson...)
```

## Ghi chú

Dự án cá nhân, không phải mã nguồn mở công khai.
