# 🎓 Nền Tảng Học Trực Tuyến (LTWEB-PTIT)

Dự án Fullstack Website Học Trực Tuyến được phát triển cho môn học Lập trình Web - PTIT. Hệ thống cung cấp nền tảng toàn diện cho việc giảng dạy và học tập trực tuyến, kết nối giữa học viên và các khóa học chất lượng.

## 🎯 Mục tiêu hệ thống

- **Học viên:** Có thể dễ dàng tìm kiếm, đăng ký/đăng nhập, mua khóa học, theo dõi bài giảng (video), và đánh giá khóa học.
- **Quản trị viên (Admin):** Nắm quyền quản lý toàn diện bao gồm danh mục, khóa học, bài học, tài khoản học viên và theo dõi thống kê qua dashboard trực quan.

---

## 🚀 1. Công nghệ sử dụng

### ⚙️ Backend
- **Runtime & Framework:** Node.js (ES Modules), Express.js
- **Database & ORM:** PostgreSQL kết hợp Prisma ORM (`@prisma/client`, `@prisma/adapter-pg`, `pg`)
- **Authentication:** JSON Web Token (JWT) và `bcrypt` để mã hóa mật khẩu
- **Validation:** `zod` xác thực dữ liệu đầu vào
- **Media Storage:** Cloudinary & Multer quản lý upload hình ảnh, video

### 🎨 Frontend
- **Framework:** React 19 (khởi tạo với Vite)
- **Routing:** React Router v6+
- **Data Fetching & State:** TanStack React Query, Axios
- **Icons:** Lucide React

---

## ✨ 2. Tính năng nổi bật

### 🌐 Dành cho mọi người (Public)
- Duyệt và xem danh mục khóa học đa dạng.
- Tìm kiếm khóa học thông minh (hỗ trợ fuzzy search từ backend).
- Xem chi tiết khóa học và học thử một số bài giảng mở.

### 🧑‍🎓 Dành cho Học viên (Student)
- Đăng nhập, đăng ký và quản lý hồ sơ cá nhân.
- Mua khóa học và mở khóa toàn bộ nội dung.
- Trải nghiệm học tập qua video bài giảng với cơ chế kiểm tra quyền truy cập chặt chẽ.
- Quản lý danh sách "Khóa học của tôi".
- Để lại đánh giá và nhận xét sau khi hoàn thành khóa học.
- Đổi mật khẩu định kỳ để bảo vệ tài khoản.

### 🛡️ Dành cho Quản trị viên (Admin)
- Dashboard thống kê tổng quan (Top khóa học bán chạy...).
- Quản lý (CRUD) danh mục khóa học.
- Quản lý (CRUD) hệ thống khóa học và cấu trúc bài học (upload video/thumbnail lên Cloudinary).
- Quản lý danh sách học viên.
- Kiểm duyệt và xóa các đánh giá/bình luận không phù hợp.

---

## 📂 3. Cấu trúc thư mục

```text
BTL-LTWEB-PTIT/
├── backend/                  # Chứa toàn bộ mã nguồn Backend (API)
│   ├── prisma/               # Cấu hình Prisma schema và migrations
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/                  # Mã nguồn chính của Backend
│   │   ├── config/           # Cấu hình CSDL, Cloudinary...
│   │   ├── controllers/      # Xử lý logic nghiệp vụ
│   │   ├── middlewares/      # Interceptor (Auth, Role, Validate, Error handler)
│   │   ├── routes/           # Định tuyến API (Admin, Auth, Public, Student)
│   │   └── schemas/          # Zod schemas để validate request
│   └── package.json
└── frontend/                 # Chứa toàn bộ mã nguồn Frontend (UI)
    ├── public/               # Tài nguyên tĩnh
    ├── src/                  # Mã nguồn chính của Frontend
    │   ├── components/       # Các component dùng chung (LessonChatbot, ErrorBoundary...)
    │   ├── context/          # Quản lý Global State (AuthContext...)
    │   ├── layouts/          # Layout bọc ngoài (MainLayout, AdminLayout)
    │   ├── pages/            # Các trang giao diện chính (Home, CourseList, Admin...)
    │   ├── routes/           # Cấu hình routes và Guards
    │   ├── services/         # Tương tác API (Axios calls)
    │   └── utils/            # Tiện ích hỗ trợ và Axios Interceptor
    └── package.json
```

---

## 🛠️ 4. Yêu cầu môi trường

Để chạy dự án, máy tính của bạn cần được cài đặt sẵn:
- **Node.js** >= 18.x
- **npm** >= 9.x (hoặc yarn/pnpm)
- **PostgreSQL** >= 14.x
- Tài khoản **Cloudinary** (để cấu hình upload media).

---

## ⚙️ 5. Hướng dẫn thiết lập và Cài đặt dự án

**Bước 1:** Clone dự án về máy và điều hướng vào thư mục.

**Bước 2:** Cài đặt dependencies cho cả Backend và Frontend.

```bash
# Cài đặt cho Backend
cd backend
npm install

# Cài đặt cho Frontend
cd ../frontend
npm install
```

---

## 🔐 6. Cấu hình biến môi trường (.env)

Trong thư mục `backend/`, copy file mẫu (nếu có) hoặc tạo mới file `.env` và điền cấu hình của bạn:

```env
# Server
PORT=5000

# Database (Thay thế username, password và database_name phù hợp)
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database_name>?schema=public"

# JWT Authentication
JWT_SECRET="generate_a_strong_random_secret_key_here"

# Cloudinary (Lấy trong Dashboard của Cloudinary)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```
> **Lưu ý:** Tuyệt đối không commit file `.env` lên Github để bảo mật thông tin.

---

## 🗄️ 7. Khởi tạo Cơ sở dữ liệu

Từ thư mục `backend/`, chạy các lệnh sau để nạp schema mới nhất vào Database của bạn thông qua Prisma:

```bash
# Generate Prisma Client
npx prisma generate

# Chạy migrations để tạo bảng trong Database
npx prisma migrate dev
```

*(Tùy chọn)* Nếu dự án có sẵn dữ liệu mẫu (seed), bạn có thể chạy:
```bash
npx prisma db seed
# Hoặc sử dụng script tùy chỉnh của dự án
npm run seed:student-courses-reviews
```

---

## 🏃 8. Chạy dự án (Development Mode)

Bạn cần mở **2 màn hình terminal** để chạy song song Backend và Frontend.

**👉 Terminal 1 - Khởi động Backend:**
```bash
cd backend
npm run dev
```
> Backend của bạn sẽ lắng nghe tại: `http://localhost:5000`

**👉 Terminal 2 - Khởi động Frontend:**
```bash
cd frontend
npm run dev
```
> Frontend (Vite) sẽ chạy tại: `http://localhost:5173` (hoặc port khác Vite tự cấp).

---

## 🔌 9. Các Endpoint API Chính

> **Base URL:** `http://localhost:5000/api`

### 🔑 Authentication
- `POST /auth/register`: Đăng ký tài khoản học viên.
- `POST /auth/login`: Xác thực và nhận JWT token.

### 🌍 API Công khai (Public)
- `GET /categories`: Lấy danh sách danh mục.
- `GET /courses`: Lấy danh sách khóa học (hỗ trợ phân trang, tìm kiếm).
- `GET /courses/top-purchased`: Khóa học mua nhiều nhất.
- `GET /courses/:id`: Lấy chi tiết một khóa học.

### 🎓 Dành cho Học viên (Yêu cầu Token)
- `POST /student/enroll`: Đăng ký mua/vào học khóa học.
- `GET /student/lessons/:id/video`: Lấy stream/URL video của bài giảng (nếu có quyền học).
- `POST /student/reviews`: Gửi đánh giá cho khóa học.
- `GET /student/my-courses`: Xem danh sách khóa học đã tham gia.
- `PUT /student/profile` & `PUT /student/change-password`: Quản lý tài khoản.

### 👑 Dành cho Admin (Yêu cầu Token + Role Admin)
Quản lý toàn bộ hệ thống thông qua các route CRUD (Create-Read-Update-Delete) với tiền tố `/admin/...`.
- `GET, POST, PUT, DELETE` → `/admin/categories/:id`
- `GET, POST, PUT, DELETE` → `/admin/courses/:id`
- `GET, POST, PUT, DELETE` → `/admin/lessons/:id`
- `GET, DELETE` → `/admin/students/:id`, `/admin/reviews/:id`
- Thống kê: `GET /admin/dashboard/top-purchased-courses`

💡 *Có thể import file `backend/postman_collection.json` vào ứng dụng Postman để nắm nhanh chi tiết các requets.*

---

## 🛡️ 10. Cơ chế Phân quyền và Bảo mật (Luồng xác thực)

1. Người dùng gửi request Login thành công, Backend trả về một JWT token.
2. Frontend (React) lưu token này vào Web Storage (hoặc state/context) và tự động đính kèm vào HTTP Header `Authorization: Bearer <token>` thông qua Axios Interceptors cho những request tiếp theo.
3. Tại tầng Backend, các route yêu cầu bảo mật sẽ phải đi qua `authMiddleware` để giải mã token. Nếu muốn giới hạn quyền (chỉ Admin), route đó sẽ đi thêm qua `roleMiddleware`.

---

## 📜 11. Các Lệnh Scripts Hữu Ích

### Trong thư mục Backend:
- `npm run dev`: Chạy server chế độ phát triển (auto-reload với nodemon).
- `npm start`: Khởi động ứng dụng chế độ production.

### Trong thư mục Frontend:
- `npm run dev`: Chạy server dev (Vite).
- `npm run build`: Đóng gói ứng dụng cho môi trường production.
- `npm run preview`: Xem thử bản build.
- `npm run lint`: Chạy ESLint kiểm tra lỗi cú pháp và format code.

---

## 📖 12. Định hướng Phát triển và Cải thiện
- [ ] Bổ sung thanh toán VNPay/Stripe thay vì chỉ đăng ký trực tiếp.
- [ ] Thêm Unit Test / Integration Test với Jest & Supertest.
- [ ] Cài đặt Swagger để cung cấp tài liệu API trực quan ngay trên trình duyệt.
- [ ] Thiết lập CI/CD với GitHub Actions để tự động hóa lint, test, build và deploy.
- [ ] Tính năng Chat realtime hoặc Notification với WebSocket.

---

## 👥 13. Tác Giả & Đóng Góp
- Dự án Bài tập lớn 
