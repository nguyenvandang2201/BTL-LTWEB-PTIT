# Hướng dẫn đóng góp

Cảm ơn bạn đã quan tâm tới dự án. Tài liệu này mô tả quy trình làm việc chung
để mã nguồn luôn thống nhất và dễ bảo trì.

---

## 1. Chuẩn bị môi trường

```bash
git clone https://github.com/nguyenvandang2201/BTL-LTWEB-PTIT.git
cd BTL-LTWEB-PTIT

# Cài dependencies cho cả backend và frontend
npm run setup

# Tạo file cấu hình từ mẫu
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Khởi động PostgreSQL bằng Docker (tuỳ chọn)
npm run db:up

# Áp dụng migration và nạp dữ liệu mẫu
npm run db:migrate
npm run db:seed

# Chạy đồng thời backend + frontend
npm run dev
```

---

## 2. Quy ước nhánh

| Tiền tố     | Dùng khi                          | Ví dụ                          |
| ----------- | --------------------------------- | ------------------------------ |
| `feat/`     | Thêm tính năng mới                | `feat/course-progress`         |
| `fix/`      | Sửa lỗi                           | `fix/login-token-expired`      |
| `refactor/` | Tái cấu trúc, không đổi hành vi   | `refactor/split-auth-context`  |
| `docs/`     | Chỉ thay đổi tài liệu             | `docs/update-api-reference`    |
| `chore/`    | Cấu hình, công cụ, dependency     | `chore/upgrade-prisma`         |

Luôn tạo nhánh mới từ `main`, không commit trực tiếp lên `main`.

---

## 3. Quy ước commit

Dự án sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

```
<loại>(<phạm vi tuỳ chọn>): <mô tả ngắn, viết thường, không dấu chấm cuối>
```

Các loại thường dùng: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `perf`, `ci`.

Ví dụ:

```
feat(student): thêm chức năng đánh dấu bài học đã hoàn thành
fix(auth): xử lý token hết hạn ở axios interceptor
docs(readme): bổ sung hướng dẫn cấu hình Cloudinary
```

---

## 4. Tiêu chuẩn mã nguồn

- **Lint sạch trước khi commit**: `npm run lint` (hoặc `npm run lint:fix`).
- **Đặt tên**: `camelCase` cho biến/hàm, `PascalCase` cho component React,
  `UPPER_SNAKE_CASE` cho hằng số.
- **Comment**: viết bằng tiếng Việt, giải thích *tại sao* chứ không lặp lại *cái gì*.
  Hàm export công khai nên có JSDoc mô tả tham số và giá trị trả về.
- **Backend**: mọi biến môi trường phải khai báo trong `src/config/env.js` và
  `.env.example`, không đọc trực tiếp `process.env` ở nơi khác.
- **Frontend**: gọi API qua các file trong `src/services/`, không gọi `axios`
  trực tiếp trong component.

---

## 5. Quy trình pull request

1. Đồng bộ nhánh với `main` mới nhất (`git pull --rebase origin main`).
2. Đảm bảo `npm run lint` và `npm run build` đều thành công.
3. Mở pull request và điền đầy đủ mẫu mô tả.
4. Chờ CI chạy xanh trước khi yêu cầu review.

---

## 6. Bảo mật

- **Không bao giờ** commit file `.env`, khoá API, chuỗi kết nối cơ sở dữ liệu
  hay bất kỳ thông tin bí mật nào.
- Nếu lỡ đẩy secret lên repository, hãy **thu hồi và tạo lại (rotate)** khoá đó
  ngay lập tức — xoá commit là chưa đủ, khoá đã bị coi là lộ.
- Xem thêm tại [SECURITY.md](SECURITY.md).
