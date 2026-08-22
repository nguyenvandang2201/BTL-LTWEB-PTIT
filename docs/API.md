# Tài liệu API

Tài liệu tham chiếu đầy đủ cho REST API của nền tảng học trực tuyến.

- **Base URL (local)**: `http://localhost:5000/api`
- **Định dạng**: JSON (trừ các endpoint upload dùng `multipart/form-data`)
- **Xác thực**: Bearer token (JWT) trong header `Authorization`

> Bộ sưu tập Postman có sẵn tại [`backend/postman_collection.json`](../backend/postman_collection.json).

---

## Mục lục

1. [Xác thực](#1-xác-thực)
2. [Quy ước chung](#2-quy-ước-chung)
3. [Endpoint hệ thống](#3-endpoint-hệ-thống)
4. [Auth](#4-auth)
5. [Public](#5-public)
6. [Student](#6-student)
7. [Admin](#7-admin)
8. [Mã lỗi](#8-mã-lỗi)

---

## 1. Xác thực

Sau khi đăng nhập thành công, server trả về một JWT. Client phải gắn token này
vào mọi request tới endpoint được bảo vệ:

```http
Authorization: Bearer <token>
```

Payload của token gồm:

```json
{ "userId": 1, "role": "student", "iat": 1771000000, "exp": 1771086400 }
```

Thời hạn mặc định là **1 ngày**, cấu hình qua biến môi trường `JWT_EXPIRES_IN`.

| Vai trò           | Quyền truy cập                                            |
| ----------------- | --------------------------------------------------------- |
| *(chưa đăng nhập)*| Các endpoint nhóm **Public** và **Auth**                   |
| Đã đăng nhập      | Thêm toàn bộ nhóm **Student**                              |
| `admin`           | Thêm toàn bộ nhóm **Admin**                                |

> Nhóm **Student** chỉ yêu cầu token hợp lệ (`verifyToken`), không ràng buộc vai
> trò cụ thể. Nhờ vậy quản trị viên vẫn có thể tự trải nghiệm luồng của học viên
> để kiểm thử. Riêng nhóm **Admin** bắt buộc phải có `role = "admin"`
> (`verifyToken` + `isAdmin`), token `student` sẽ nhận `403`.

---

## 2. Quy ước chung

### Giới hạn tần suất (rate limit)

| Phạm vi              | Hạn mức mặc định                                      |
| -------------------- | ----------------------------------------------------- |
| `/api/*`             | 300 request / 15 phút / IP                            |
| `/api/auth/*`        | 20 request / 15 phút / IP (chỉ tính request thất bại) |
| `/api/student/chat`  | 10 request / phút / **tài khoản**                     |

Hạn mức riêng của chatbot tính theo tài khoản đăng nhập thay vì IP, vì mỗi câu
hỏi kích hoạt ít nhất một lần gọi Gemini và một lần gọi DeepSeek — đều là API
trả phí theo lượt.

Khi vượt hạn mức, server trả về `429 Too Many Requests`.

### Response lỗi

Lỗi nghiệp vụ và lỗi hệ thống:

```json
{ "message": "Tài khoản không tồn tại" }
```

Lỗi validate đầu vào (từ Zod) trả về `400` kèm chi tiết từng trường:

```json
{
  "message": "Email không hợp lệ",
  "errors": [
    {
      "path": ["email"],
      "field": "email",
      "message": "Email không hợp lệ",
      "code": "invalid_format"
    }
  ]
}
```

Trường `message` lặp lại lỗi đầu tiên để giao diện hiển thị nhanh; mảng `errors`
chứa chi tiết từng trường, trong đó `field` là tên trường dạng chuỗi (`"email"`,
`"address.city"`) tiện cho việc gắn thông báo ngay dưới ô nhập liệu.

Ở môi trường non-production, response lỗi có thêm trường `stack` để hỗ trợ debug.

---

## 3. Endpoint hệ thống

### `GET /api/health`

Kiểm tra tình trạng dịch vụ. Không yêu cầu xác thực và **không** bị rate limit.

**Response `200`**

```json
{
  "status": "ok",
  "environment": "development",
  "uptime": 128.42,
  "timestamp": "2026-08-22T05:26:09.558Z"
}
```

---

## 4. Auth

### `POST /auth/register`

Đăng ký tài khoản mới. Vai trò được gán mặc định là `student`.

**Body**

| Trường      | Kiểu   | Bắt buộc | Ràng buộc          |
| ----------- | ------ | -------- | ------------------ |
| `full_name` | string | ✅       | Không được rỗng    |
| `email`     | string | ✅       | Định dạng email    |
| `password`  | string | ✅       | Tối thiểu 6 ký tự  |

```json
{
  "full_name": "Nguyễn Văn An",
  "email": "an.nguyen@ptit.edu.vn",
  "password": "Student@123"
}
```

**Response `201`**

```json
{ "message": "Đăng ký thành công" }
```

| Mã    | Ý nghĩa                  |
| ----- | ------------------------ |
| `400` | Email đã được sử dụng    |
| `500` | Lỗi máy chủ              |

---

### `POST /auth/login`

Đăng nhập và nhận JWT.

**Body**

| Trường     | Kiểu   | Bắt buộc | Ràng buộc       |
| ---------- | ------ | -------- | --------------- |
| `email`    | string | ✅       | Định dạng email |
| `password` | string | ✅       | Không rỗng      |

**Response `200`**

```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "role": "student" }
```

| Mã    | Ý nghĩa                  |
| ----- | ------------------------ |
| `401` | Sai mật khẩu             |
| `404` | Tài khoản không tồn tại  |

---

## 5. Public

Không yêu cầu xác thực.

### `GET /categories`

Trả về toàn bộ danh mục khoá học.

**Response `200`**

```json
[
  { "category_id": 1, "name": "Lập trình Web", "description": "Các khoá học về phát triển ứng dụng web..." }
]
```

---

### `GET /courses`

Danh sách khoá học, sắp xếp theo số lượt mua giảm dần.

**Query parameters**

| Tham số       | Kiểu   | Mô tả                                                              |
| ------------- | ------ | ------------------------------------------------------------------ |
| `q`           | string | Từ khoá tìm kiếm theo tiêu đề (mờ, bỏ dấu, không phân biệt hoa thường) |
| `category_id` | number | Lọc theo danh mục                                                  |

Tìm kiếm sử dụng extension PostgreSQL `unaccent` + `pg_trgm` để hỗ trợ gõ thiếu
dấu và sai chính tả nhẹ. Nếu extension không khả dụng, hệ thống **tự động chuyển
sang** tìm kiếm `LIKE` không phân biệt hoa thường thay vì báo lỗi.

**Response `200`**

```json
[
  {
    "course_id": 3,
    "category_id": 1,
    "title": "React từ cơ bản đến thực chiến",
    "description": "Xây dựng ứng dụng React hoàn chỉnh...",
    "price": "799000",
    "image_url": "https://...",
    "created_at": "2026-08-01T09:00:00.000Z",
    "category": { "name": "Lập trình Web" },
    "total_buyers": 42
  }
]
```

---

### `GET /courses/top-purchased`

Top 10 khoá học được mua nhiều nhất (chỉ tính enrollment đã thanh toán).

**Response `200`**

```json
[{ "course_id": 3, "title": "React từ cơ bản đến thực chiến", "total_purchases": 42 }]
```

---

### `GET /courses/:id`

Chi tiết khoá học kèm danh sách bài giảng và đánh giá.

**Kiểm soát truy cập nội dung**: hai bài giảng đầu tiên là **học thử miễn phí**
(`is_locked: false`, có `video_url`). Từ bài thứ ba trở đi, trường `video_url`
bị **loại khỏi response** và `is_locked` được đặt thành `true`.

**Response `200`**

```json
{
  "course_id": 3,
  "title": "React từ cơ bản đến thực chiến",
  "price": "799000",
  "category": { "name": "Lập trình Web" },
  "lessons": [
    { "lesson_id": 11, "title": "Bài 1: Component và JSX", "order_index": 1, "video_url": "https://...", "is_locked": false },
    { "lesson_id": 13, "title": "Bài 3: useEffect", "order_index": 3, "is_locked": true }
  ],
  "reviews": [
    { "review_id": 5, "rating": 5, "comment": "Khoá học rất dễ hiểu...", "user": { "full_name": "Nguyễn Văn An" } }
  ]
}
```

| Mã    | Ý nghĩa                  |
| ----- | ------------------------ |
| `404` | Không tìm thấy khóa học  |

---

## 6. Student

Tất cả endpoint dưới đây yêu cầu header `Authorization: Bearer <token>`.

### `POST /student/enroll`

Ghi danh (mua) một khoá học.

**Body**

| Trường      | Kiểu   | Bắt buộc | Ràng buộc            |
| ----------- | ------ | -------- | -------------------- |
| `course_id` | number | ✅       | Số nguyên dương      |

**Response `201`**

```json
{ "message": "Mua thành công! Vào học ngay" }
```

| Mã    | Ý nghĩa                      |
| ----- | ---------------------------- |
| `400` | Bạn đã sở hữu khóa này rồi   |
| `401` | Thiếu token                  |

---

### `GET /student/lessons/:id/video`

Lấy thông tin bài giảng kèm `video_url`.

Hai bài đầu của mỗi khoá luôn được phép xem. Từ bài thứ ba, người dùng phải có
enrollment với `is_paid = true`.

**Response `200`**

```json
{
  "lesson_id": 13,
  "course_id": 3,
  "title": "Bài 3: useEffect và vòng đời component",
  "video_url": "https://res.cloudinary.com/.../lesson.mp4",
  "order_index": 3,
  "created_at": "2026-08-01T09:00:00.000Z"
}
```

| Mã    | Ý nghĩa                            |
| ----- | ---------------------------------- |
| `403` | Vui lòng mua khóa học để xem       |
| `404` | Không tìm thấy bài học             |

---

### `POST /student/reviews`

Gửi đánh giá cho khoá học đã mua.

**Body**

| Trường      | Kiểu   | Bắt buộc | Ràng buộc        |
| ----------- | ------ | -------- | ---------------- |
| `course_id` | number | ✅       | Số nguyên dương  |
| `rating`    | number | ✅       | Số nguyên 1–5    |
| `comment`   | string | ✅       | Không được rỗng  |

**Response `201`**

```json
{ "message": "Cảm ơn đánh giá của bạn" }
```

| Mã    | Ý nghĩa                            |
| ----- | ---------------------------------- |
| `403` | Bạn phải học mới được đánh giá     |

---

### `GET /student/my-courses`

Danh sách khoá học đã ghi danh của người dùng hiện tại.

**Response `200`**

```json
[
  {
    "enrollment_id": 7,
    "user_id": 2,
    "course_id": 3,
    "is_paid": true,
    "created_at": "2026-08-10T03:12:00.000Z",
    "course": { "course_id": 3, "title": "React từ cơ bản đến thực chiến", "price": "799000" }
  }
]
```

---

### `PUT /student/profile`

Cập nhật thông tin cá nhân.

**Body**

| Trường      | Kiểu   | Bắt buộc | Ràng buộc       |
| ----------- | ------ | -------- | --------------- |
| `full_name` | string | ✅       | Không được rỗng |

**Response `200`**

```json
{
  "message": "Cập nhật thông tin thành công",
  "user": { "user_id": 2, "full_name": "Nguyễn Văn An", "email": "an.nguyen@ptit.edu.vn", "role": "student", "created_at": "..." }
}
```

---

### `PUT /student/change-password`

Đổi mật khẩu.

**Body**

| Trường         | Kiểu   | Bắt buộc | Ràng buộc         |
| -------------- | ------ | -------- | ----------------- |
| `old_password` | string | ✅       | Tối thiểu 6 ký tự |
| `new_password` | string | ✅       | Tối thiểu 6 ký tự |

**Response `200`**

```json
{ "message": "Đổi mật khẩu thành công" }
```

| Mã    | Ý nghĩa                        |
| ----- | ------------------------------ |
| `400` | Mật khẩu cũ không chính xác    |
| `404` | Không tìm thấy người dùng      |

---

### `POST /student/chat`

Đặt câu hỏi cho trợ lý AI trong ngữ cảnh một bài học.

Áp dụng đúng quy tắc mở khoá nội dung như video: hai bài đầu của mỗi khoá luôn
được phép, từ bài thứ ba yêu cầu enrollment `is_paid = true`.

**Body**

| Trường               | Kiểu   | Bắt buộc | Ràng buộc                          |
| -------------------- | ------ | -------- | ---------------------------------- |
| `lesson_id`          | number | ✅       | Số nguyên dương                    |
| `messages`           | array  | ✅       | 1–20 phần tử, phần tử cuối là câu hỏi mới |
| `messages[].role`    | string | ✅       | `"user"` hoặc `"assistant"`        |
| `messages[].content` | string | ✅       | Không được rỗng                    |

```json
{
  "lesson_id": 13,
  "messages": [
    { "role": "user", "content": "useEffect chạy khi nào?" }
  ]
}
```

**Response `200`**

Trường `routing` cho biết hệ thống đã chọn chiến lược nào và vì sao — hữu ích khi
gỡ lỗi chất lượng câu trả lời. `answer` và `reply` chứa cùng một nội dung
(`reply` giữ lại để tương thích ngược).

```json
{
  "answer": "useEffect chạy sau mỗi lần component render xong...",
  "reply": "useEffect chạy sau mỗi lần component render xong...",
  "routing": {
    "strategy": "RAG",
    "score": -1,
    "confidence": "low",
    "sourceChunks": ["useEffect là hook dùng để thực hiện side effect..."]
  }
}
```

Khi chiến lược là `LCP`, `routing` trả về `contextSize` (số ký tự ngữ cảnh đã
nạp) thay cho `sourceChunks`.

| Mã    | Ý nghĩa                                                   |
| ----- | --------------------------------------------------------- |
| `400` | Thiếu `lesson_id`, `messages` rỗng hoặc không có câu hỏi   |
| `403` | Chưa mua khoá học chứa bài học này                        |
| `404` | Không tìm thấy bài học                                    |
| `429` | Hỏi quá nhanh (vượt 10 câu / phút)                        |
| `500` | Chưa cấu hình `GEMINI_API_KEY` / `DEEPSEEK_API_KEY`, hoặc lỗi từ dịch vụ AI |

---

## 7. Admin

Tất cả endpoint yêu cầu `Authorization: Bearer <token>` với vai trò `admin`
(`verifyToken` + `isAdmin`). Truy cập bằng token `student` sẽ nhận `403`.

### Danh mục

| Method   | Endpoint                | Mô tả                |
| -------- | ----------------------- | -------------------- |
| `POST`   | `/admin/categories`     | Tạo danh mục mới     |
| `PUT`    | `/admin/categories/:id` | Cập nhật danh mục    |
| `DELETE` | `/admin/categories/:id` | Xoá danh mục         |

**Body khi tạo**

| Trường        | Kiểu   | Bắt buộc |
| ------------- | ------ | -------- |
| `name`        | string | ✅       |
| `description` | string | ❌       |

Khi cập nhật, mọi trường đều là tuỳ chọn.

---

### Khoá học

| Method   | Endpoint             | Mô tả                                    |
| -------- | -------------------- | ---------------------------------------- |
| `GET`    | `/admin/courses/:id` | Chi tiết khoá học kèm toàn bộ bài giảng  |
| `POST`   | `/admin/courses`     | Tạo khoá học (hỗ trợ upload ảnh)         |
| `PUT`    | `/admin/courses/:id` | Cập nhật khoá học                        |
| `DELETE` | `/admin/courses/:id` | Xoá khoá học                             |

**Content-Type**: `multipart/form-data` — trường file tên `image`
(chấp nhận `jpg`, `jpeg`, `png`, `webp`; được đẩy lên Cloudinary thư mục `courses`).

| Trường        | Kiểu   | Bắt buộc khi tạo | Ràng buộc          |
| ------------- | ------ | ---------------- | ------------------ |
| `title`       | string | ✅               | Không được rỗng    |
| `price`       | number | ✅               | ≥ 0                |
| `category_id` | number | ✅               | Số nguyên          |
| `description` | string | ❌               |                    |
| `image_url`   | string | ❌               | Dùng khi không upload file |
| `image`       | file   | ❌               | Ảnh bìa khoá học   |

---

### Bài giảng

| Method   | Endpoint             | Mô tả                              |
| -------- | -------------------- | ---------------------------------- |
| `POST`   | `/admin/lessons`     | Tạo bài giảng (hỗ trợ upload video)|
| `PUT`    | `/admin/lessons/:id` | Cập nhật bài giảng                 |
| `DELETE` | `/admin/lessons/:id` | Xoá bài giảng                      |

**Content-Type**: `multipart/form-data` — trường file tên `video`
(chấp nhận `mp4`, `mov`, `avi`, `webm`, `mkv`, `m4v`; Cloudinary thư mục `lessons`).

| Trường        | Kiểu   | Bắt buộc khi tạo | Ràng buộc  |
| ------------- | ------ | ---------------- | ---------- |
| `course_id`   | number | ✅               | Số nguyên  |
| `title`       | string | ✅               | Không rỗng |
| `order_index` | number | ✅               | Số nguyên  |
| `video`       | file   | ❌               | Video bài giảng |

---

### AI Chatbot — indexing nội dung

Trước khi chatbot trả lời dựa trên nội dung khoá học, quản trị viên phải index
khoá học đó: nội dung text của từng bài giảng được chia nhỏ, tạo embedding và
lưu vào bảng `lesson_chunks`.

| Method | Endpoint                          | Mô tả                                     |
| ------ | --------------------------------- | ----------------------------------------- |
| `POST` | `/admin/courses/:id/index`        | Chạy indexing (chunk + embedding)         |
| `GET`  | `/admin/courses/:id/index-status` | Kiểm tra số chunk đã index của khoá học   |

> ⚠️ Sửa nội dung bài học **không** tự động re-index. Cần gọi lại endpoint index.
> Thao tác này tiêu tốn quota API Gemini theo số đoạn được tạo.

---

### Học viên & thống kê

| Method   | Endpoint                                   | Mô tả                                 |
| -------- | ------------------------------------------ | ------------------------------------- |
| `GET`    | `/admin/students`                          | Danh sách học viên (hỗ trợ `?sort=`)  |
| `GET`    | `/admin/students/:id`                      | Chi tiết học viên và khoá đã mua      |
| `GET`    | `/admin/dashboard/top-purchased-courses`   | Top khoá học bán chạy                 |
| `DELETE` | `/admin/reviews/:id`                       | Xoá một đánh giá                      |

---

## 8. Mã lỗi

| Mã    | Ý nghĩa                                                                |
| ----- | ---------------------------------------------------------------------- |
| `200` | Thành công                                                             |
| `201` | Tạo mới thành công                                                     |
| `400` | Dữ liệu đầu vào không hợp lệ hoặc vi phạm quy tắc nghiệp vụ            |
| `401` | Chưa đăng nhập / thiếu token / sai mật khẩu                            |
| `403` | Đã đăng nhập nhưng không đủ quyền, hoặc token hết hạn / không hợp lệ   |
| `404` | Không tìm thấy tài nguyên hoặc đường dẫn                               |
| `429` | Vượt quá giới hạn tần suất request                                     |
| `500` | Lỗi máy chủ                                                            |
