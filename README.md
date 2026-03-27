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
<img width="2829" height="1531" alt="Screenshot 2026-03-27 151831" src="https://github.com/user-attachments/assets/4d64e7a9-ecff-42c3-b4a3-fc603ca5bd87" />
<img width="2837" height="1538" alt="Screenshot 2026-03-27 151821" src="https://github.com/user-attachments/assets/ca028380-2bd2-4c9e-b359-96e14f0e42f7" />
<img width="2830" height="1530" alt="Screenshot 2026-03-27 151900" src="https://github.com/user-attachments/assets/d5d2667d-bbef-4f12-a74b-2d23335995fa" />
<img width="1792" height="1614" alt="localhost_5173_login" src="https://github.com/user-attachments/assets/5b89bb13-79fb-41b9-9aa3-3b79790fc696" />
<img width="1792" height="1614" alt="localhost_5173_login (1)" src="https://github.com/user-attachments/assets/00b4394a-4da8-47d4-b58b-30583db1c6b3" />
<img width="1792" height="9320" alt="localhost_5173_login (2)" src="https://github.com/user-attachments/assets/d5afdab5-409f-4e8a-bb01-9fb57e9edec9" />
<img width="1792" height="3320" alt="localhost_5173_login (3)" src="https://github.com/user-attachments/assets/4c08f665-8d15-4bf8-a869-3efd310c6f94" />
<img width="1792" height="2938" alt="localhost_5173_login (4)" src="https://github.com/user-attachments/assets/a5332bcd-ddc3-4758-aa70-b61addc2513d" />
<img width="1792" height="5826" alt="localhost_5173_learning_32" src="https://github.com/user-attachments/assets/fd747c88-3546-432b-a62a-5e8099d168f6" />
<img width="1792" height="2214" alt="localhost_5173_learning_32 (1)" src="https://github.com/user-attachments/assets/7fdeed44-1c42-4da5-a683-31a44ed6245b" />
<img width="2830" height="1531" alt="Screenshot 2026-03-27 151851" src="https://github.com/user-attachments/assets/bbed3985-ff83-4bff-86f4-c103d8ac339c" />
<img width="2833" height="1527" alt="Screenshot 2026-03-27 151842" src="https://github.com/user-attachments/assets/8dd5217c-8a65-4027-a5ea-1ac15db77f9f" />

## 14. Tác giả

Đồ án LTWEB - PTIT.
