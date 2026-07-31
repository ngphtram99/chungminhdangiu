# Nhật Ký Đôi Ta 💌📍

App lưu lại các địa điểm hai đứa đã đi / muốn đi / chưa đi, có bản đồ Google Maps,
và có thể gắn link ảnh từ Google Photos hoặc Google Drive. Toàn bộ miễn phí (Vercel + Supabase).

## Tổng quan cách hoạt động

- **Vercel**: host app (miễn phí, gói Hobby).
- **Supabase**: database miễn phí lưu danh sách địa điểm, để cả hai người đều thấy dữ liệu giống nhau trên mọi thiết bị.
- **Google Maps**: nhúng bản đồ bằng link miễn phí (`google.com/maps?q=...&output=embed`), **không cần** API key hay thẻ tín dụng.
- **Ảnh**: bạn tự upload ảnh lên Google Photos hoặc Google Drive, lấy **link share công khai/xem được**, rồi dán vào app. App không upload ảnh hộ bạn (để tránh phải làm OAuth phức tạp), nhưng cách này 100% miễn phí và đơn giản.
- **Không có đăng nhập**: app dùng chung 1 link riêng tư giữa hai bạn. Đừng public link này ra ngoài vì bất kỳ ai có link đều xem/sửa được dữ liệu.

---

## Bước 1: Tạo project Supabase (database miễn phí)

1. Vào https://supabase.com → **Start your project** → đăng nhập bằng GitHub/Google.
2. **New project** → đặt tên bất kỳ (vd: `couple-places`) → chọn mật khẩu database (lưu lại, ít dùng tới) → chọn region gần bạn (vd Singapore) → **Create new project**. Đợi ~2 phút để khởi tạo.
3. Vào tab **SQL Editor** (biểu tượng terminal ở sidebar) → **New query**.
4. Mở file `supabase-schema.sql` trong project này, copy toàn bộ nội dung, dán vào SQL Editor → bấm **Run**. Việc này tạo bảng `places` để lưu dữ liệu.
5. Vào **Project Settings** (biểu tượng bánh răng) → **API**. Bạn sẽ cần 2 giá trị:
   - **Project URL** → đây là `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → đây là `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Giữ tab này mở, lát nữa cần dùng.

---

## Bước 2: Chạy thử ở máy (không bắt buộc nhưng nên làm)

Cần cài [Node.js](https://nodejs.org) (bản LTS) trước.

```bash
cd couple-places
npm install
cp .env.local.example .env.local
```

Mở file `.env.local` vừa tạo, dán 2 giá trị từ Bước 1 vào:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Chạy thử:

```bash
npm run dev
```

Mở http://localhost:3000 để xem app.

---

## Bước 3: Đưa code lên GitHub

1. Vào https://github.com → **New repository** → đặt tên (vd `couple-places`) → **Create repository** (để **Private** nếu muốn).
2. Trong thư mục project, chạy:

```bash
git init
git add .
git commit -m "Init couple places app"
git branch -M main
git remote add origin https://github.com/TEN-BAN/couple-places.git
git push -u origin main
```

(thay `TEN-BAN` bằng username GitHub của bạn)

---

## Bước 4: Deploy lên Vercel (miễn phí)

1. Vào https://vercel.com → đăng nhập bằng GitHub.
2. **Add New...** → **Project** → chọn repo `couple-places` vừa push → **Import**.
3. Ở phần **Environment Variables**, thêm 2 biến giống hệt file `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Bấm **Deploy**. Đợi 1-2 phút, Vercel sẽ đưa cho bạn 1 link dạng `couple-places.vercel.app`.
5. Gửi link đó cho người yêu bạn là dùng chung được ngay 🎉

Mỗi lần bạn `git push` code mới lên GitHub, Vercel sẽ tự động build và deploy lại.

---

## Ảnh trong app

- **Ảnh đại diện 2 người** và **ảnh mô tả quán** đều là **upload ảnh thật** từ máy, lưu trên Supabase Storage (miễn phí, đã tạo sẵn 2 bucket `avatars` và `place-photos` trong bước chạy SQL).
- Không cần Google Photos/Drive hay API key gì cả — chọn ảnh trong form là xong, ảnh hiện thumbnail nhỏ ngay trên thẻ quán.

---

## Muốn nâng cấp thêm sau này?

- **Thêm mật khẩu bảo vệ trang**: có thể thêm Vercel Password Protection (cần gói trả phí) hoặc tự làm 1 trang đăng nhập đơn giản bằng mật khẩu chung lưu trong biến môi trường.
- **Upload ảnh trực tiếp từ app** (thay vì dán link): cần tích hợp Google Drive Picker API + OAuth — phức tạp hơn, nếu muốn mình có thể làm tiếp phiên bản này.
- **Tên miền riêng**: gắn domain riêng cho project trong Vercel → Settings → Domains.

---

## Cấu trúc project

```
app/
  layout.tsx        # layout gốc, load font
  page.tsx           # trang chính: danh sách, lọc theo trạng thái
  globals.css
components/
  PlaceCard.tsx        # thẻ hiển thị 1 địa điểm + bản đồ nhúng
  AddEditPlaceModal.tsx # form thêm/sửa địa điểm
  StatusTabs.tsx        # tab lọc Đã đi / Muốn đi / Chưa đi
  StampBadge.tsx        # con dấu trạng thái kiểu passport
lib/
  supabase.ts   # kết nối Supabase
  maps.ts       # tạo link nhúng Google Maps miễn phí
  types.ts      # kiểu dữ liệu Place
supabase-schema.sql   # câu lệnh SQL tạo bảng dữ liệu
```
