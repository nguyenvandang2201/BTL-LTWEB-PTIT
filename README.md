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
![z7663609442054_de609aa1b90cc2de8947da268ad68a58](https://github.com/user-attachments/assets/bea7e25a-01b7-4f51-ad82-259c7ece5a53)
![z7663609442053_2c9dac75ceadec81dcafd214e5b89a0a](https://github.com/user-attachments/assets/802ff1ac-9fe7-429e-95a5-655514bec419)
![z7663609423224_5c78365f10fd8040fff83ab98787ea2e](https://github.com/user-attachments/assets/886b179c-9b97-4ef1-be41-db69405b6fad)
![z7663609423222_e0fb3f614d64938e8a3a5c59eec8d03e](https://github.com/user-attachments/assets/570b99f0-eb4f-46c2-8213-8d4803b89286)
![z7663609404586_902147b29ed58aedc6aa8cfcd38185ed](https://github.com/user-attachments/assets/b5e2eeaf-18b1-498d-b5d9-9e6e4581d812)
![z7663609404354_359883498cbb4a61213b27b011e6dbbe](https://github.com/user-attachments/assets/0f429f54-3798-4c58-94f9-b1e09904dcf0)
![z7663609404353_b5d4e3e52d777009ab9cd3711afe321e](https://github.com/user-attachments/assets/dcfd0fb5-0063-459d-afad-22fd18acba0d)
![z7663609404352_0097b4d0232699c6638f8a0fc87d864f](https://github.com/user-attachments/assets/c9b6b89b-83b5-4ba1-9229-a8660d3b437c)
![z7663609404350_dde21706ade28cfb25ae1b06a509d6f6](https://github.com/user-attachments/assets/13c5499c-9f06-4cc8-8dda-7c957200f45f)
![z7663609384699_12ec6cc7de9825c02a797769a8a61699](https://github.com/user-attachments/assets/77a2a3f3-d104-4a27-bf21-1105a4f7cb0f)
![z7663609384698_c35f88e22db98b8ea58b5a0b76ce7782](https://github.com/user-attachments/assets/2de99c10-3a9b-4a6d-a9b6-17e7351977cd)
![z7663609366782_f371fc57b0a3d71455fca4422af08d4b](https://github.com/user-attachments/assets/70625556-aa8b-4952-ad4e-61d35da12222)
![z7663609366758_f8543f74566d96331893dd08be271fd5](https://github.com/user-attachments/assets/66d1a421-4688-421c-87cc-0b89aba3f844)
![z7663609442055_51bec242c110555f20b1adc02f6bf822](https://github.com/user-attachments/assets/f459b8f7-8422-4498-930a-506c48041869)

## 14. Tác giả

Đồ án LTWEB - PTIT.
