# Hướng dẫn hiểu toàn bộ dự án English-Study

Tài liệu này viết cho người **chưa biết gì về code**. Đọc lần lượt từ trên xuống,
mỗi phần xây trên phần trước. Không cần đọc hết một lần — cứ đọc tới đâu mở file
tương ứng ra xem tới đó.

---

## Phần 1. Bức tranh lớn: một trang web gồm những gì?

Khi bạn mở `app-english-study.vercel.app` trên điện thoại, có **3 mảnh** cùng làm việc:

1. **Trình duyệt (máy của bạn)** — nơi hiển thị nút bấm, ô nhập, danh sách từ.
   Dân trong nghề gọi là **client** (phía người dùng) hoặc **frontend** (mặt tiền).

2. **Máy chủ (server)** — một máy tính chạy 24/7 ở đâu đó (ở đây là dịch vụ
   **Vercel**). Nó nhận yêu cầu từ trình duyệt ("cho tôi xem danh sách từ"),
   xử lý, rồi trả kết quả về. Gọi là **backend** (hậu trường).

3. **Cơ sở dữ liệu (database)** — một cái kho lưu trữ lâu dài, nằm ở dịch vụ
   **Neon**. Mọi từ vựng, bài học, tài khoản của bạn nằm ở đây. Server tắt/bật
   thì dữ liệu vẫn còn.

> **Ví dụ đời thường:** bạn (client) gọi món ở quán ăn. Người phục vụ + bếp
> (server) nhận yêu cầu, nấu. Kho thực phẩm (database) là nơi lấy nguyên liệu.

Luồng cơ bản luôn là:

```
Trình duyệt  →  Server  →  Database  →  Server  →  Trình duyệt
  (yêu cầu)     (xử lý)   (lấy data)   (dựng)    (hiển thị)
```

---

## Phần 2. Các khái niệm nền cần nắm

| Từ | Nghĩa dễ hiểu |
|---|---|
| **Framework** | Bộ khung dựng sẵn để không phải làm mọi thứ từ số 0. Dự án này dùng **Next.js**. |
| **Next.js** | Framework để làm web bằng React. Nó lo việc định tuyến (URL nào ra trang nào), chạy code trên server, tối ưu tốc độ. |
| **React** | Thư viện để dựng giao diện bằng các "mảnh ghép" gọi là **component** (ví dụ: một cái thẻ từ vựng, một cái nút). |
| **Component** | Một mảnh giao diện tái sử dụng được, viết trong 1 file. Ví dụ `WordList.tsx` = "danh sách từ vựng". |
| **TypeScript** | Là JavaScript (ngôn ngữ của web) nhưng thêm phần "khai báo kiểu dữ liệu" để bắt lỗi sớm. File đuôi `.ts` / `.tsx`. |
| **Database / PostgreSQL** | Kho dữ liệu dạng bảng (giống Excel nhiều sheet có liên kết nhau). PostgreSQL là loại database dự án này dùng. |
| **ORM / Prisma** | Cầu nối giúp viết câu lấy dữ liệu bằng JavaScript thay vì bằng ngôn ngữ database (SQL) khó hơn. Dự án dùng **Prisma**. |
| **Migration** | Một "bản ghi thay đổi cấu trúc database". Mỗi lần thêm bảng/cột mới → tạo 1 migration. Nằm trong `prisma/migrations/`. |
| **Auth / Đăng nhập** | Xác định "bạn là ai". Dự án dùng **Auth.js** + đăng nhập bằng Google. |
| **API** | Một "cửa" trên server để trình duyệt gọi vào lấy dữ liệu. Ví dụ `/api/dictionary` = cửa tra từ điển. |
| **Server Action** | Cách của Next.js để trình duyệt "nhờ server làm một việc" (thêm từ, xoá từ) mà không cần tự tạo API. Là các hàm có dòng `"use server"` ở đầu. |
| **Deploy** | Đưa code từ máy bạn lên server thật để mọi người dùng được. Ở đây: push code lên GitHub → Vercel tự động deploy. |
| **PWA** | "Progressive Web App" — web nhưng cài được vào màn hình chính điện thoại như app thật, mở được cả khi mạng yếu. |

---

## Phần 3. Công nghệ trong dự án & vai trò

Xem file `package.json` — phần `dependencies` liệt kê mọi "đồ nghề" dự án dùng:

| Gói | Dùng để làm gì |
|---|---|
| `next` | Framework chính. |
| `react`, `react-dom` | Dựng giao diện. |
| `@prisma/client`, `prisma` | Nói chuyện với database. |
| `@prisma/adapter-pg` | Bộ chuyển đổi để Prisma kết nối đúng loại database PostgreSQL. |
| `next-auth` (Auth.js) | Xử lý đăng nhập Google. |
| `@auth/prisma-adapter` | Giúp Auth.js lưu tài khoản/phiên đăng nhập vào database qua Prisma. |
| `tailwindcss` | Cách viết CSS (màu sắc, khoảng cách, bố cục) bằng các "class" ngắn ngay trong giao diện, ví dụ `text-2xl font-bold`. |
| `typescript`, `@types/*` | Bộ kiểm tra kiểu dữ liệu. |
| `eslint` | Bộ soát lỗi/phong cách code. |
| `sharp` | Xử lý ảnh lúc build (thu nhỏ ảnh...). |

---

## Phần 4. Bản đồ thư mục — file nào làm gì

```
english_study/
├── prisma/                     ← Mọi thứ về DATABASE
│   ├── schema.prisma           ← ĐỊNH NGHĨA các bảng dữ liệu (quan trọng, đọc kỹ)
│   └── migrations/             ← Lịch sử thay đổi cấu trúc database
│
├── public/                     ← File tĩnh, ai cũng tải được qua URL
│   ├── icons/                  ← Icon app (favicon, icon PWA)
│   ├── manifest.json           ← Khai báo cho PWA (tên app, màu, icon)
│   └── sw.js                   ← "Service worker" — giúp app chạy khi mất mạng
│
├── src/                        ← TOÀN BỘ MÃ NGUỒN của app
│   ├── app/                    ← Các TRANG và API (Next.js App Router)
│   │   ├── layout.tsx          ← Khung chung bọc mọi trang (có <Header/>)
│   │   ├── page.tsx            ← Trang chủ "/" (màn hình đăng nhập / dashboard)
│   │   ├── globals.css         ← CSS nền tảng, khai báo màu chung
│   │   ├── error.tsx           ← Màn hình hiện khi 1 trang bị lỗi
│   │   ├── global-error.tsx    ← Màn hình lỗi mức toàn app
│   │   │
│   │   ├── words/              ← Khu vực "Từ vựng"
│   │   │   ├── page.tsx        ← Trang danh sách từ "/words"
│   │   │   ├── add/page.tsx    ← Trang thêm 1 từ "/words/add"
│   │   │   └── bulk-add/page.tsx  ← Trang nhập hàng loạt "/words/bulk-add"
│   │   │
│   │   ├── review/page.tsx     ← Trang ôn tập flashcard "/review"
│   │   │
│   │   └── api/                ← Các "cửa" API
│   │       ├── auth/[...nextauth]/route.ts  ← Cửa xử lý đăng nhập Google
│   │       ├── dictionary/route.ts          ← Tra từ điển + dịch (nút "Tự động điền")
│   │       └── export/                      ← Xuất dữ liệu ra file
│   │           ├── route.ts                 ← Xuất .json
│   │           └── csv/route.ts             ← Xuất .csv (mở bằng Excel)
│   │
│   ├── components/             ← Các MẢNH GIAO DIỆN tái sử dụng
│   │   ├── Header.tsx          ← Thanh trên cùng (logo, nút điều hướng, đăng xuất)
│   │   ├── WordForm.tsx        ← Form thêm 1 từ mới
│   │   ├── WordList.tsx        ← Danh sách các thẻ từ + sửa/xoá/chọn nhiều
│   │   ├── FlashcardReview.tsx ← Màn ôn tập: lật thẻ, "Nhớ rồi / Chưa nhớ"
│   │   ├── LessonManager.tsx   ← Ô tạo/xoá Bài học
│   │   ├── LessonTabs.tsx      ← Dải nút lọc theo Bài
│   │   ├── SearchForm.tsx      ← Ô tìm kiếm từ
│   │   ├── SubmitButton.tsx    ← Nút gửi form, tự khoá khi đang xử lý
│   │   └── ServiceWorkerRegister.tsx ← Kích hoạt sw.js khi mở app
│   │
│   ├── lib/                    ← Code dùng chung, không phải giao diện
│   │   ├── prisma.ts           ← Tạo 1 kết nối database dùng chung toàn app
│   │   ├── auth.ts             ← Cấu hình đăng nhập (Google, cách lưu phiên)
│   │   └── actions/            ← SERVER ACTIONS (việc server làm hộ trình duyệt)
│   │       ├── words.ts        ← Thêm/sửa/xoá/ôn tập từ vựng
│   │       └── lessons.ts      ← Tạo/xoá bài học
│   │
│   ├── types/
│   │   └── next-auth.d.ts      ← Khai báo thêm: "session có kèm user.id"
│   │
│   └── generated/prisma/       ← Code Prisma TỰ SINH RA (không sửa tay, không commit)
│
├── package.json                ← Danh sách đồ nghề + các lệnh (dev, build...)
├── next.config.ts              ← Cấu hình Next.js (hiện để trống)
├── tsconfig.json               ← Cấu hình TypeScript
├── eslint.config.mjs           ← Cấu hình bộ soát lỗi
├── prisma.config.ts            ← Cấu hình Prisma (chỉ tới schema, database)
├── .env                        ← BÍ MẬT: chuỗi kết nối DB, khoá Google (KHÔNG commit)
├── AGENTS.md / CLAUDE.md        ← Ghi chú cho trợ lý AI (Next.js tự tạo AGENTS.md)
└── design/                     ← Ảnh gốc (logo) — không deploy
```

**Quy tắc đọc nhanh:** đuôi `.tsx` = có giao diện; đuôi `.ts` = chỉ logic;
tên thư mục trong `src/app/` = một phần đường dẫn URL.

---

## Phần 5. Chuyện gì xảy ra khi... (lần theo luồng)

### 5a. Khi bạn mở app lần đầu và bấm "Đăng nhập với Google"

1. Trình duyệt tải trang `/` → chạy `src/app/page.tsx`.
2. Dòng `const session = await auth()` hỏi server: "người này đăng nhập chưa?".
   Chưa → hiện nút đăng nhập.
3. Bấm nút → chạy đoạn `signIn("google")` → chuyển sang trang Google.
4. Google xác nhận xong, gọi ngược về `/api/auth/...` (`src/lib/auth.ts` xử lý).
5. Auth.js lưu tài khoản bạn vào database (các bảng `User`, `Account`, `Session`).
6. Từ giờ mỗi request đều kèm 1 "vé" (session) chứng minh bạn là ai.

### 5b. Khi bạn vào trang "Từ vựng" (`/words`)

1. Chạy `src/app/words/page.tsx` **trên server**.
2. Kiểm tra đăng nhập; chưa đăng nhập thì `redirect("/")`.
3. Gọi database 4 việc cùng lúc (`Promise.all`): lấy danh sách từ, đếm tổng,
   đếm tất cả, lấy danh sách bài học.
   - Chú ý: mọi câu truy vấn đều kèm `userId` → **chỉ lấy dữ liệu của bạn**.
4. Server dựng sẵn HTML rồi gửi về trình duyệt.
5. Trình duyệt hiển thị. Các phần cần tương tác (nút Sửa, chọn nhiều...) do
   component `WordList.tsx` (có `"use client"`) đảm nhận.

### 5c. Khi bạn thêm 1 từ mới

1. `WordForm.tsx` (chạy ở trình duyệt) thu thập nội dung bạn gõ.
2. Bấm "Thêm từ" → gọi hàm `createWord` trong `src/lib/actions/words.ts`.
   Đây là **Server Action**: trình duyệt nhờ server chạy hàm này.
3. Trên server, `createWord`:
   - `requireUserId()` — chắc chắn bạn đã đăng nhập.
   - Đọc các ô nhập, cắt khoảng trắng thừa.
   - `resolveLessonId()` — kiểm tra "Bài" bạn chọn đúng là bài của bạn.
   - `prisma.word.create(...)` — ghi từ mới vào database.
   - `revalidatePath("/words")` — báo Next.js "trang /words có dữ liệu mới,
     dựng lại đi".
4. Trình duyệt tự cập nhật danh sách.

### 5d. Nút "✨ Tự động điền"

1. `WordForm.tsx` gọi `/api/dictionary?word=apple`.
2. `src/app/api/dictionary/route.ts` trên server:
   - Gọi API từ điển miễn phí bên ngoài (`dictionaryapi.dev`) lấy phiên âm + ví dụ.
   - Gọi API dịch (`MyMemory`) dịch từ và câu ví dụ sang tiếng Việt.
   - Trả gói kết quả `{ term, ipa, meaning, example }` — `example` gộp sẵn dạng
     "câu tiếng Anh / bản dịch tiếng Việt".
3. Form điền sẵn các ô đó cho bạn (bạn vẫn sửa được trước khi lưu).

### 5e. Khi bạn ôn tập (`/review`)

1. `src/app/review/page.tsx` lấy các từ (lọc theo Bài nếu có chọn).
2. `FlashcardReview.tsx` hiện từng thẻ; bấm để lật xem nghĩa.
3. Bấm "Nhớ rồi / Chưa nhớ" → gọi Server Action `reviewWord`:
   - "Nhớ rồi" → nâng trạng thái từ `NEW → LEARNING → KNOWN`.
   - "Chưa nhớ" → đưa về `NEW`.
   - Lưu `lastReviewedAt` = thời điểm hiện tại.

---

## Phần 6. Database: 3 bảng cốt lõi

Mở `prisma/schema.prisma`. Bỏ qua 4 bảng đầu (`User`, `Account`, `Session`,
`VerificationToken`) — chúng là chuẩn của Auth.js để lưu đăng nhập. Ba bảng
"của app" là:

### `User` (người dùng)
Mỗi người đăng nhập Google = 1 dòng. Có `id`, `name`, `email`, `image`.

### `Lesson` (bài học)
| Cột | Ý nghĩa |
|---|---|
| `id` | Mã riêng |
| `userId` | Bài này của ai |
| `name` | Tên bài, ví dụ "Bài 1", "Unit 5: Travel" |

### `Word` (từ vựng)
| Cột | Ý nghĩa |
|---|---|
| `id` | Mã riêng |
| `userId` | Từ này của ai |
| `lessonId` | Thuộc bài nào (có thể trống = chưa phân loại) |
| `term` | Từ tiếng Anh |
| `meaning` | Nghĩa tiếng Việt (có thể trống khi nhập hàng loạt) |
| `ipa` | Phiên âm |
| `example` | Câu ví dụ, dạng "câu tiếng Anh / bản dịch tiếng Việt" |
| `status` | `NEW` / `LEARNING` / `KNOWN` — mức thuộc |
| `lastReviewedAt` | Lần ôn gần nhất |
| `createdAt`, `updatedAt` | Thời điểm tạo / sửa |

**Quan hệ:** 1 `User` có nhiều `Lesson` và nhiều `Word`. 1 `Lesson` có nhiều
`Word`. Xoá User → xoá sạch Word + Lesson của họ. Xoá Lesson → Word không bị
xoá, chỉ mất nhãn (`lessonId` thành trống).

---

## Phần 7. Tập đọc một file thật — `src/lib/actions/lessons.ts`

Đây là file ngắn nhất mà vẫn đủ ý. Mở song song với phần giải thích:

```ts
"use server";
```
→ "Mọi hàm trong file này chạy trên server, không phải trình duyệt."

```ts
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
```
→ Mượn 3 công cụ: hàm dựng lại trang, hàm kiểm tra đăng nhập, kết nối database.
(`@/` là lối tắt trỏ tới thư mục `src/`.)

```ts
async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Chưa đăng nhập");
  }
  return session.user.id;
}
```
→ "Lấy id người dùng hiện tại. Nếu chưa đăng nhập thì báo lỗi và dừng."
Hàm này được gọi ở đầu mọi hành động để chặn người lạ.

```ts
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
```
Đọc từng dòng:
- Nhận `formData` (nội dung form người dùng gõ).
- Lấy `userId` — đồng thời chặn nếu chưa đăng nhập.
- Lấy ô `name`, cắt khoảng trắng. Nếu rỗng → thoát, không làm gì.
- `prisma.lesson.create` → thêm 1 dòng vào bảng `Lesson`, gắn `userId` của
  chính người này.
- Báo cho 2 trang `/words` và `/review` dựng lại để thấy bài mới.

```ts
export async function deleteLesson(id: string) {
  const userId = await requireUserId();
  await prisma.lesson.deleteMany({ where: { id, userId } });
  revalidatePath("/words");
  revalidatePath("/review");
}
```
→ Xoá bài học. Điểm quan trọng: `where: { id, userId }` nghĩa là
"xoá bài có mã này **VÀ** thuộc về tôi". Nếu ai đó gửi mã bài của người khác,
điều kiện `userId` không khớp → không xoá gì. Đây là cách bảo vệ dữ liệu.

Khi hiểu file này, bạn đã hiểu **khuôn mẫu chung** của mọi Server Action trong
dự án. File `words.ts` chỉ là phiên bản dài hơn của đúng khuôn đó.

---

## Phần 8. Các lệnh hay dùng (chạy trong terminal, tại thư mục dự án)

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy app ở máy để thử, mở `http://localhost:3000`. Sửa code là tự cập nhật. |
| `npm run build` | Đóng gói bản chạy thật. Dùng để kiểm tra không có lỗi trước khi deploy. |
| `npm run lint` | Soát lỗi/phong cách code. |
| `npx prisma studio` | Mở giao diện xem/sửa database trực tiếp trên trình duyệt. |
| `npx prisma migrate dev` | Sau khi sửa `schema.prisma`, tạo migration + cập nhật database. |

---

## Phần 9. Lộ trình để hiểu sâu hơn (theo thứ tự)

1. **Chạy `npm run dev`**, vừa dùng app vừa mở file tương ứng với trang đang xem.
2. **Đọc `prisma/schema.prisma`** — hiểu dữ liệu thì hiểu được mọi thứ còn lại.
3. **Đọc `src/lib/actions/lessons.ts`** (đã giải thích ở Phần 7), rồi tới
   `src/lib/actions/words.ts`.
4. **Đọc `src/app/words/page.tsx`** — xem một "trang server" lấy dữ liệu ra sao.
5. **Đọc `src/components/WordList.tsx`** — xem một "component client" xử lý bấm nút.
6. **Thử sửa nhỏ:** đổi một dòng chữ tiếng Việt trong giao diện, lưu, xem nó
   đổi trên `localhost`. Đây là cách học nhanh nhất.
7. Khi thoải mái rồi, tìm hiểu thêm: React (component, `useState`), rồi Next.js
   App Router (Server Component vs Client Component).

### Nên học nền tảng ở đâu (tiếng Việt/Anh, miễn phí)
- **JavaScript cơ bản:** roadmap.sh/javascript, hoặc "JavaScript" trên MDN.
- **React:** trang chính thức `react.dev/learn` (có phần "Quick Start" ngắn).
- **Next.js:** `nextjs.org/learn` — khoá tương tác chính chủ.
- **Prisma:** `prisma.io/docs` phần "Getting Started".

---

## Tóm tắt một câu

> App này = **Next.js** dựng giao diện + chạy logic trên server,
> **Prisma** nói chuyện với **database PostgreSQL** để lưu từ vựng,
> **Auth.js** lo đăng nhập Google, tất cả chạy trên **Vercel**.
> Mọi thao tác thêm/sửa/xoá đi qua **Server Action** trong `src/lib/actions/`,
> và luôn kiểm tra "dữ liệu này có phải của bạn không" trước khi động vào.
