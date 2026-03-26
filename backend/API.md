# API Documentation - Khóa học trực tuyến

Tài liệu này được viết theo `postman_collection.json` hiện tại.

## 1) Thông tin chung

| Mục | Giá trị |
|---|---|
| Base URL | `http://localhost:5000/api` |
| JSON Content-Type | `application/json` |
| Auth Header (Admin) | `Authorization: Bearer <adminToken>` |
| Auth Header (Student) | `Authorization: Bearer <studentToken>` |

### Collection variables

| Biến | Mô tả / Giá trị mặc định |
|---|---|
| `baseUrl` | `http://localhost:5000/api` |
| `adminToken` | Token đăng nhập admin |
| `studentToken` | Token đăng nhập student |
| `categoryId` | ID danh mục (mặc định `1`) |
| `courseId` | ID khóa học (mặc định `1`) |
| `lessonId` | ID bài giảng (mặc định `1`) |
| `studentId` | ID học viên (mặc định `1`) |
| `reviewId` | ID đánh giá (mặc định `1`) |

---

## 2) Auth

| Tên API | Method | Endpoint | Auth | Body mẫu | Response |
|---|---|---|---|---|---|
| Đăng ký tài khoản | `POST` | `/auth/register` | Không cần | `{"full_name":"Người Dùng Mới","email":"newuser@test.com","password":"123456"}` | `201`, `400` |
| Đăng nhập (admin/student) | `POST` | `/auth/login` | Không cần | Admin: `{"email":"admin@test.com","password":"123456"}`<br>Student: `{"email":"user1@gmail.com","password":"123456"}` | `200` (trả về `token`) |

---

## 3) Public APIs

| Tên API | Method | Endpoint | Auth | Query/Body | Response | Ghi chú |
|---|---|---|---|---|---|---|
| Lấy danh sách danh mục | `GET` | `/categories` | Không cần | - | `200` | Public endpoint |
| Lấy danh sách khóa học | `GET` | `/courses` | Không cần | - | `200` | Trả về khóa học mới nhất trước |
| Xem chi tiết khóa học | `GET` | `/courses/:courseId` | Không cần | Path: `courseId` | `200`, `404` | Public xem được 2 bài đầu mở khóa |

---

## 4) Admin APIs (`Bearer {{adminToken}}`)

### 4.1 Danh mục

| Tên API | Method | Endpoint | Body mẫu |
|---|---|---|---|
| Tạo danh mục | `POST` | `/admin/categories` | `{"name":"Lập trình Mobile","description":"Các khóa học về mobile"}` |
| Sửa danh mục | `PUT` | `/admin/categories/:categoryId` | `{"name":"Tên danh mục đã sửa","description":"Mô tả mới"}` |
| Xóa danh mục | `DELETE` | `/admin/categories/:categoryId` | - |

### 4.2 Khóa học

| Tên API | Method | Endpoint | Content-Type | Body/Form-data |
|---|---|---|---|---|
| Lấy chi tiết khóa học (admin) | `GET` | `/admin/courses/:courseId` | - | - |
| Tạo khóa học | `POST` | `/admin/courses` | `multipart/form-data` | `title`, `price`, `category_id`, `description`, `image` (file, tùy chọn) |
| Sửa khóa học | `PUT` | `/admin/courses/:courseId` | `multipart/form-data` | `title`, `price`, `category_id`, `description`, `image` (file, tùy chọn) |
| Xóa khóa học | `DELETE` | `/admin/courses/:courseId` | - | - |

### 4.3 Bài giảng

| Tên API | Method | Endpoint | Content-Type | Body/Form-data |
|---|---|---|---|---|
| Thêm bài giảng | `POST` | `/admin/lessons` | `multipart/form-data` | `course_id`, `title`, `order_index`, `video` (file) |
| Sửa bài giảng | `PUT` | `/admin/lessons/:lessonId` | `multipart/form-data` | `title`, `order_index`, `video` (file, tùy chọn) |
| Xóa bài giảng | `DELETE` | `/admin/lessons/:lessonId` | - | - |

### 4.4 Học viên

| Tên API | Method | Endpoint | Query |
|---|---|---|---|
| Danh sách học viên (mới nhất) | `GET` | `/admin/students` | `sort=newest` |
| Danh sách học viên (cũ nhất) | `GET` | `/admin/students` | `sort=oldest` |
| Chi tiết học viên | `GET` | `/admin/students/:studentId` | - |

### 4.5 Đánh giá

| Tên API | Method | Endpoint | Body |
|---|---|---|---|
| Xóa đánh giá | `DELETE` | `/admin/reviews/:reviewId` | - |

---

## 5) Student APIs (`Bearer {{studentToken}}`)

| Tên API | Method | Endpoint | Body mẫu |
|---|---|---|---|
| Mua khóa học | `POST` | `/student/enroll` | `{"course_id":1}` |
| Xem khóa học đã mua | `GET` | `/student/my-courses` | - |
| Xem video bài giảng | `GET` | `/student/lessons/:lessonId/video` | - |
| Đánh giá khóa học | `POST` | `/student/reviews` | `{"course_id":1,"rating":5,"comment":"Khóa học rất hay và dễ hiểu!"}` |
| Cập nhật thông tin cá nhân | `PUT` | `/student/profile` | `{"full_name":"Nguyễn Văn A đã cập nhật"}` |
| Đổi mật khẩu | `PUT` | `/student/change-password` | `{"old_password":"123456","new_password":"newpassword123"}` |

---

## 6) Thứ tự test nhanh trên Postman (gợi ý)

| Bước | Hành động |
|---|---|
| 1 | `POST /auth/login` (admin) để lấy `adminToken` |
| 2 | `POST /auth/login` (student) để lấy `studentToken` |
| 3 | Chạy nhóm Public |
| 4 | Chạy nhóm Admin (tạo danh mục -> tạo khóa học -> tạo bài giảng) |
| 5 | Chạy nhóm Student (mua khóa học -> xem bài giảng -> đánh giá) |
