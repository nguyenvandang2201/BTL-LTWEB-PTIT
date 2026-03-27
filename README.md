# Nền Tảng Học Trực Tuyến (LTWEB-PTIT)

Project fullstack học trực tuyến gồm:
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Frontend**: React + Vite + React Router + React Query

Mục tiêu hệ thống:
- Học viên có thể đăng ký/đăng nhập, mua khóa học, học bài giảng, đánh giá khóa học.
- Quản trị viên có thể quản lý danh mục, khóa học, bài học, học viên và dashboard thống kê.

---

## 1. Công nghệ sử dụng

### Backend
- Node.js (ESM)
- Express
- Prisma ORM + PostgreSQL (`@prisma/client`, `@prisma/adapter-pg`, `pg`)
- JWT (`jsonwebtoken`) cho xác thực
- `bcrypt` cho hash mật khẩu
- `zod` cho validate request
- Cloudinary + Multer cho upload ảnh/video

### Frontend
- React 19 + Vite
- React Router
- TanStack React Query
- Axios
- Lucide React

---

## 2. Tính năng chính

### Người dùng công khai
- Xem danh mục khóa học
- Xem danh sách khóa học
- Tìm kiếm khóa học (backend có hỗ trợ fuzzy search + fallback)
- Xem chi tiết khóa học, xem trước một phần nội dung

### Học viên
- Đăng ký / đăng nhập
- Mua khóa học
- Xem video bài học (có kiểm tra quyền truy cập)
- Xem danh sách khóa học của tôi
- Cập nhật hồ sơ, đổi mật khẩu
- Đánh giá khóa học đã mua

### Quản trị viên
- CRUD danh mục
- CRUD khóa học
- CRUD bài giảng
- Quản lý học viên
- Xem top khóa học được mua nhiều nhất
- Xóa review/bình luận

---

## 3. Cấu trúc thư mục

```text
.
├── backend
│   ├── prisma
│   │   ├── schema.prisma
│   │   └── migrations
│   └── src
│       ├── config
│       ├── controllers
│       ├── middlewares
│       ├── routes
│       └── schemas
└── frontend
    └── src
        ├── components
        ├── context
        ├── layouts
        ├── pages
        ├── routes
        ├── services
        └── utils
```

---

## 4. Yêu cầu môi trường

- Node.js >= 18
- npm >= 9
- PostgreSQL >= 14
- Tài khoản Cloudinary (nếu dùng upload media thật)

---

## 5. Cài đặt dự án

Từ thư mục gốc, cài dependencies cho cả backend và frontend.

```bash
cd backend
npm install

cd ../frontend
npm install
```

---

## 6. Cấu hình biến môi trường

Tạo file `.env` trong thư mục `backend`:

```env
# Server
PORT=5000

# Database
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database_name>?schema=public"

# JWT
JWT_SECRET="your_jwt_secret"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

Lưu ý bảo mật:
- Không commit `.env` lên repository.
- Nếu lộ thông tin Cloudinary/JWT trong lịch sử git, nên rotate secret ngay.

---

## 7. Khởi tạo cơ sở dữ liệu

Trong thư mục `backend`:

```bash
npx prisma generate
npx prisma migrate dev
```

Project có cấu hình seed trong Prisma (`node prisma/seed.js`). Nếu bạn có file seed trong môi trường local, có thể chạy:

```bash
npx prisma db seed
```

Ngoài ra trong `package.json` backend có script:

```bash
npm run seed:student-courses-reviews
```

Script này yêu cầu file seed tương ứng tồn tại trong dự án local.

---

## 8. Chạy project (development)

Mở 2 terminal riêng:

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

Backend chạy mặc định tại: `http://localhost:5000`

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

Frontend (Vite) thường chạy tại: `http://localhost:5173`

---

## 9. API chính

Base URL backend: `http://localhost:5000/api`

### Auth
- `POST /auth/register`
- `POST /auth/login`

### Public
- `GET /categories`
- `GET /courses`
- `GET /courses/top-purchased`
- `GET /courses/:id`

### Student (cần Bearer token)
- `POST /student/enroll`
- `GET /student/lessons/:id/video`
- `POST /student/reviews`
- `GET /student/my-courses`
- `PUT /student/profile`
- `PUT /student/change-password`

### Admin (cần Bearer token + role admin)
- `POST /admin/categories`
- `PUT /admin/categories/:id`
- `DELETE /admin/categories/:id`
- `GET /admin/courses/:id`
- `POST /admin/courses`
- `PUT /admin/courses/:id`
- `DELETE /admin/courses/:id`
- `POST /admin/lessons`
- `PUT /admin/lessons/:id`
- `DELETE /admin/lessons/:id`
- `GET /admin/students`
- `GET /admin/students/:id`
- `GET /admin/dashboard/top-purchased-courses`
- `DELETE /admin/reviews/:id`

Bạn có thể import file `backend/postman_collection.json` để test API nhanh.

---

## 10. Luồng phân quyền

- Token JWT được trả sau khi login.
- Frontend lưu token vào `localStorage` và tự gắn vào header `Authorization: Bearer <token>` qua Axios interceptor.
- Backend dùng middleware xác thực token và middleware role để chặn route admin.

---

## 11. Scripts hữu ích

### Backend
- `npm run dev`: chạy backend với nodemon
- `npm start`: chạy backend production mode

### Frontend
- `npm run dev`: chạy frontend local
- `npm run build`: build production
- `npm run preview`: preview bản build
- `npm run lint`: kiểm tra lint

---

## 12. Gợi ý cải thiện

- Thêm file `.env.example` cho backend/frontend
- Thêm test (unit/integration) cho controller và route
- Chuẩn hóa tài liệu API bằng Swagger/OpenAPI
- Cấu hình CI (lint + test + build)

---
## 13. Giao diện

## 14. Tác giả

Đồ án LTWEB - PTIT.
