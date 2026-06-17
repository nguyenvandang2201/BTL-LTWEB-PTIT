# 🎓 Nền Tảng Học Trực Tuyến (LTWEB-PTIT)

Dự án Fullstack Website Học Trực Tuyến được phát triển cho môn học Lập trình Web - PTIT. Hệ thống cung cấp nền tảng toàn diện cho việc giảng dạy và học tập trực tuyến, kết nối giữa học viên và các khóa học chất lượng — kèm theo trợ lý AI hỏi-đáp ngay trong bài giảng.

## 🎯 Mục tiêu hệ thống

- **Học viên:** Có thể dễ dàng tìm kiếm, đăng ký/đăng nhập, mua khóa học, theo dõi bài giảng (video), đặt câu hỏi cho AI Chatbot ngay trong bài học và đánh giá khóa học.
- **Quản trị viên (Admin):** Nắm quyền quản lý toàn diện bao gồm danh mục, khóa học, bài học, tài khoản học viên, index nội dung cho AI Chatbot và theo dõi thống kê qua dashboard trực quan.

---

## 🚀 1. Công nghệ sử dụng

### ⚙️ Backend
- **Runtime & Framework:** Node.js (ES Modules), Express.js
- **Database & ORM:** PostgreSQL kết hợp Prisma ORM (`@prisma/client`, `@prisma/adapter-pg`, `pg`)
- **Authentication:** JSON Web Token (JWT) và `bcrypt` để mã hóa mật khẩu
- **Validation:** `zod` xác thực dữ liệu đầu vào
- **Media Storage:** Cloudinary & Multer quản lý upload hình ảnh, video
- **AI Chatbot (DRA):**
  - `@google/generative-ai` (Gemini `text-embedding-004`) để tạo vector embedding cho nội dung bài học
  - `openai` SDK trỏ tới DeepSeek API (`deepseek-chat`) để sinh câu trả lời
  - Tự xây dựng cơ chế Retrieval-Augmented Generation (RAG) + Long-Context Pipeline (LCP) — chi tiết ở [mục 5](#-5-kiến-trúc-ai-chatbot-dra)

### 🎨 Frontend
- **Framework:** React 19 (khởi tạo với Vite)
- **Styling:** Tailwind CSS 4
- **Routing:** React Router v6+
- **Data Fetching & State:** TanStack React Query, Axios
- **Icons:** Lucide React

---

## ✨ 2. Tính năng nổi bật

### 🌐 Dành cho mọi người (Public)
- Duyệt và xem danh mục khóa học đa dạng.
- Tìm kiếm khóa học thông minh (hỗ trợ fuzzy search không phân biệt dấu/hoa-thường nhờ `unaccent` + `pg_trgm`, tự fallback về `ILIKE` nếu DB chưa có extension).
- Xem chi tiết khóa học và học thử 2 bài giảng mở đầu tiên của mỗi khóa học.

### 🧑‍🎓 Dành cho Học viên (Student)
- Đăng nhập, đăng ký và quản lý hồ sơ cá nhân.
- Mua khóa học và mở khóa toàn bộ nội dung.
- Trải nghiệm học tập qua video bài giảng với cơ chế kiểm tra quyền truy cập chặt chẽ.
- **Hỏi đáp với AI Chatbot ngay trong bài học**: đặt câu hỏi về nội dung bài giảng, AI tự động chọn chiến lược truy xuất phù hợp (xem mục 5) và trả lời dựa trên đúng nội dung khóa học.
- Quản lý danh sách "Khóa học của tôi".
- Để lại đánh giá và nhận xét sau khi hoàn thành khóa học.
- Đổi mật khẩu định kỳ để bảo vệ tài khoản.

### 🛡️ Dành cho Quản trị viên (Admin)
- Dashboard thống kê tổng quan (Top khóa học bán chạy...).
- Quản lý (CRUD) danh mục khóa học.
- Quản lý (CRUD) hệ thống khóa học và cấu trúc bài học (upload video/thumbnail lên Cloudinary, soạn nội dung text cho bài học).
- **Index nội dung khóa học cho AI Chatbot** (chia chunk + tạo embedding) và xem trạng thái đã index hay chưa.
- Quản lý danh sách học viên.
- Kiểm duyệt và xóa các đánh giá/bình luận không phù hợp.

---

## 🤖 5. Kiến trúc AI Chatbot (DRA)

Chatbot không gọi LLM một cách "ngây thơ" mà dùng cơ chế **Dynamic Retrieval Augmentation (DRA)**: với mỗi câu hỏi, hệ thống tự định tuyến (route) sang một trong hai chiến lược xử lý trước khi gọi mô hình sinh câu trả lời.

```
Học viên hỏi → queryRouter (chấm điểm câu hỏi)
                     │
        ┌────────────┴────────────┐
   score thấp (factual)      score cao (tổng hợp/so sánh)
        │                          │
        ▼                          ▼
   RAG Pipeline               LCP Pipeline
 (truy xuất top-K chunk    (nhồi toàn bộ nội dung
  liên quan nhất bằng        khóa học vào prompt,
  cosine similarity)         giới hạn LCP_MAX_CHARS)
        │                          │
        └────────────┬─────────────┘
                      ▼
            DeepSeek Chat Completion
                      │
                      ▼
              Trả lời + thông tin routing
```

1. **`queryRouter`** chấm điểm câu hỏi dựa trên từ khóa (so sánh/phân tích/tổng hợp → tăng điểm; câu hỏi factual "là gì/khi nào/ai là" → giảm điểm) và độ phức tạp câu hỏi (số từ, số mệnh đề). Điểm vượt ngưỡng `ROUTER_LCP_THRESHOLD` → chọn chiến lược **LCP**, ngược lại dùng **RAG**.
2. **RAG Pipeline**: embed câu hỏi bằng Gemini, tính cosine similarity với toàn bộ `LessonChunk` đã index của khóa học, lấy top-K đoạn liên quan nhất (`RAG_TOP_K`) làm ngữ cảnh cho DeepSeek. Nếu khóa học chưa được index, fallback dùng trực tiếp nội dung bài học.
3. **LCP Pipeline (Long-Context Pipeline)**: dùng cho câu hỏi cần tổng hợp/so sánh nhiều bài học — nhồi toàn bộ nội dung các bài học trong khóa học vào prompt (cắt ở `LCP_MAX_CHARS` ký tự nếu vượt giới hạn) rồi để DeepSeek tự đọc và trả lời.
4. **Indexing**: là một bước riêng, admin phải chủ động bấm "Index" cho từng khóa học (`POST /api/admin/courses/:id/index`). Nội dung bài học được chia nhỏ thành các đoạn (`RAG_CHUNK_SIZE` ký tự, chồng lấn `RAG_CHUNK_OVERLAP`), mỗi đoạn được tạo embedding và lưu vào bảng `lesson_chunks`. **Sửa nội dung bài học không tự động re-index** — cần index lại thủ công.
5. Giao diện chatbot là một panel nổi (floating) trong trang học (`Learning.jsx`), hiển thị kèm badge chiến lược đã dùng (`RAG`/`LCP`) và điểm số routing cho mỗi câu trả lời.

---

## 📂 3. Cấu trúc thư mục

```text
BTL-LTWEB-PTIT/
├── backend/                  # Chứa toàn bộ mã nguồn Backend (API)
│   ├── prisma/                   # Cấu hình Prisma schema và migrations
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/                      # Mã nguồn chính của Backend
│   │   ├── config/                   # Cấu hình CSDL, Cloudinary, DeepSeek client...
│   │   ├── controllers/              # Xử lý logic nghiệp vụ (admin, auth, public, student, chat)
│   │   ├── middlewares/              # Interceptor (Auth, Role, Validate, Error handler)
│   │   ├── routes/                   # Định tuyến API (Admin, Auth, Public, Student)
│   │   ├── schemas/                  # Zod schemas để validate request
│   │   └── services/                 # Pipeline AI: chunking, embedding, indexing, RAG, LCP, query router
│   └── package.json
└── frontend/                 # Chứa toàn bộ mã nguồn Frontend (UI)
    ├── public/                   # Tài nguyên tĩnh
    ├── src/                      # Mã nguồn chính của Frontend
    │   ├── components/               # Các component dùng chung (LessonChatbot, ErrorBoundary...)
    │   ├── context/                  # Quản lý Global State (AuthContext...)
    │   ├── layouts/                   # Layout bọc ngoài (MainLayout, AdminLayout)
    │   ├── pages/                     # Các trang giao diện chính (Home, CourseList, Admin...)
    │   ├── routes/                    # Cấu hình routes và Guards
    │   ├── services/                  # Tương tác API (Axios calls)
    │   └── utils/                     # Tiện ích hỗ trợ và Axios Interceptor
    └── package.json
```

---

## 🛠️ 4. Yêu cầu môi trường

Để chạy dự án, máy tính của bạn cần được cài đặt sẵn:
- **Node.js** >= 18.x
- **npm** >= 9.x (hoặc yarn/pnpm)
- **PostgreSQL** >= 14.x
- Tài khoản **Cloudinary** (để cấu hình upload media).
- API Key **Google Gemini** (dùng cho embedding của AI Chatbot).
- API Key **DeepSeek** (dùng để sinh câu trả lời cho AI Chatbot).

---

## ⚙️ 6. Hướng dẫn thiết lập và Cài đặt dự án

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

## 🔐 7. Cấu hình biến môi trường (.env)

Trong thư mục `backend/`, tạo file `.env` và điền cấu hình của bạn:

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

# Google Gemini (dùng để tạo embedding cho AI Chatbot)
GEMINI_API_KEY="your_gemini_api_key"

# DeepSeek (dùng để sinh câu trả lời cho AI Chatbot)
DEEPSEEK_API_KEY="your_deepseek_api_key"
DEEPSEEK_MODEL="deepseek-chat"          # Tùy chọn, mặc định deepseek-chat

# DRA Router — ngưỡng điểm để chuyển sang chiến lược LCP (mặc định 3)
ROUTER_LCP_THRESHOLD=3

# RAG — cấu hình chunking & truy xuất
RAG_TOP_K=3                              # Số chunk liên quan nhất được lấy ra mỗi câu hỏi
RAG_CHUNK_SIZE=1500                      # Số ký tự mỗi chunk
RAG_CHUNK_OVERLAP=200                    # Số ký tự chồng lấn giữa 2 chunk liên tiếp

# LCP — giới hạn ký tự context khi nhồi toàn bộ khóa học vào prompt
LCP_MAX_CHARS=200000
```
> **Lưu ý:** Tuyệt đối không commit file `.env` lên Github để bảo mật thông tin.

---

## 🗄️ 8. Khởi tạo Cơ sở dữ liệu

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

> **Lưu ý:** Sau khi có dữ liệu bài học, vào trang Admin → Khóa học để bấm **Index** cho từng khóa học trước khi dùng thử AI Chatbot (mục 5), nếu không hệ thống sẽ trả lời dựa trên nội dung bài học thô thay vì chunk đã embed.

---

## 🏃 9. Chạy dự án (Development Mode)

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

## 🔌 10. Các Endpoint API Chính

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
- `POST /student/chat`: Gửi câu hỏi tới AI Chatbot trong ngữ cảnh bài học đang xem (`{ lesson_id, messages }`), trả về `{ answer, reply, routing }`.

### 👑 Dành cho Admin (Yêu cầu Token + Role Admin)
Quản lý toàn bộ hệ thống thông qua các route CRUD (Create-Read-Update-Delete) với tiền tố `/admin/...`.
- `GET, POST, PUT, DELETE` → `/admin/categories/:id`
- `GET, POST, PUT, DELETE` → `/admin/courses/:id`
- `GET, POST, PUT, DELETE` → `/admin/lessons/:id`
- `GET, DELETE` → `/admin/students/:id`, `/admin/reviews/:id`
- `POST /admin/courses/:id/index`: Chạy indexing (chunk + embedding) nội dung khóa học cho AI Chatbot.
- `GET /admin/courses/:id/index-status`: Kiểm tra khóa học đã được index hay chưa, số lượng chunk hiện có.
- Thống kê: `GET /admin/dashboard/top-purchased-courses`

💡 *Có thể import file `backend/postman_collection.json` vào ứng dụng Postman để nắm nhanh chi tiết các requets.*

---

## 🛡️ 11. Cơ chế Phân quyền và Bảo mật (Luồng xác thực)

1. Người dùng gửi request Login thành công, Backend trả về một JWT token.
2. Frontend (React) lưu token này vào Web Storage (hoặc state/context) và tự động đính kèm vào HTTP Header `Authorization: Bearer <token>` thông qua Axios Interceptors cho những request tiếp theo.
3. Tại tầng Backend, các route yêu cầu bảo mật sẽ phải đi qua `authMiddleware` để giải mã token. Nếu muốn giới hạn quyền (chỉ Admin), route đó sẽ đi thêm qua `roleMiddleware`.
4. Quy tắc mở khóa nội dung: 2 bài học đầu tiên (theo `order_index`) của mỗi khóa học luôn miễn phí; các bài còn lại — bao gồm cả việc dùng AI Chatbot trên bài đó — yêu cầu học viên có `Enrollment` với `is_paid = true`.

---

## 📜 12. Các Lệnh Scripts Hữu Ích

### Trong thư mục Backend:
- `npm run dev`: Chạy server chế độ phát triển (auto-reload với nodemon).
- `npm start`: Khởi động ứng dụng chế độ production.
- `npm run seed:student-courses-reviews`: Seed dữ liệu mẫu học viên/khóa học/đánh giá.
- `npm run seed:students`: Seed dữ liệu mẫu học viên.

### Trong thư mục Frontend:
- `npm run dev`: Chạy server dev (Vite).
- `npm run build`: Đóng gói ứng dụng cho môi trường production.
- `npm run preview`: Xem thử bản build.
- `npm run lint`: Chạy ESLint kiểm tra lỗi cú pháp và format code.

---

## 📖 13. Định hướng Phát triển và Cải thiện
- [ ] Bổ sung thanh toán VNPay/Stripe thay vì chỉ đăng ký trực tiếp.
- [ ] Thêm Unit Test / Integration Test với Jest & Supertest.
- [ ] Cài đặt Swagger để cung cấp tài liệu API trực quan ngay trên trình duyệt.
- [ ] Thiết lập CI/CD với GitHub Actions để tự động hóa lint, test, build và deploy.
- [ ] Tính năng Chat realtime hoặc Notification với WebSocket.
- [ ] Tự động re-index khóa học khi nội dung bài học thay đổi.

---

## 👥 14. Tác Giả & Đóng Góp
- Dự án Bài tập lớn
