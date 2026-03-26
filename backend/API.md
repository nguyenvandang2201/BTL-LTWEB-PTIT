# API Documentation - Khóa học trực tuyến

Tài liệu này được viết theo `postman_collection.json` hiện tại.

## 1) Thông tin chung

- **Base URL**: `http://localhost:5000/api`
- **Định dạng JSON**: `Content-Type: application/json`
- **Xác thực JWT**:
  - Admin: `Authorization: Bearer <adminToken>`
  - Student: `Authorization: Bearer <studentToken>`

### Collection variables

- `baseUrl`: `http://localhost:5000/api`
- `adminToken`
- `studentToken`
- `categoryId`
- `courseId`
- `lessonId`
- `studentId`
- `reviewId`

---

## 2) Auth

### 2.1 Đăng ký tài khoản

- **Method**: `POST`
- **Endpoint**: `/auth/register`
- **Auth**: Không cần
- **Body**:

```json
{
  "full_name": "Người Dùng Mới",
  "email": "newuser@test.com",
  "password": "123456"
}
```

- **Response**:
  - `201`: Đăng ký thành công
  - `400`: Dữ liệu không hợp lệ / email đã tồn tại

### 2.2 Đăng nhập

- **Method**: `POST`
- **Endpoint**: `/auth/login`
- **Auth**: Không cần
- **Body (Admin mẫu)**:

```json
{
  "email": "admin@test.com",
  "password": "123456"
}
```

- **Body (Student seed mẫu)**:

```json
{
  "email": "user1@gmail.com",
  "password": "123456"
}
```

- **Response**:
  - `200`: Đăng nhập thành công, trả về `token`

---

## 3) Public APIs

### 3.1 Lấy danh sách danh mục

- **Method**: `GET`
- **Endpoint**: `/categories`
- **Auth**: Không cần
- **Response**: `200`

### 3.2 Lấy danh sách khóa học

- **Method**: `GET`
- **Endpoint**: `/courses`
- **Auth**: Không cần
- **Response**: `200`
- **Ghi chú**: Trả về khóa học mới nhất trước.

### 3.3 Xem chi tiết khóa học

- **Method**: `GET`
- **Endpoint**: `/courses/:courseId`
- **Auth**: Không cần
- **Response**:
  - `200`: Thành công
  - `404`: Không tìm thấy khóa học
- **Ghi chú**: Public xem được 2 bài đầu mở khóa.

---

## 4) Admin APIs (`Bearer {{adminToken}}`)

## 4.1 Danh mục

### 4.1.1 Tạo danh mục

- **Method**: `POST`
- **Endpoint**: `/admin/categories`
- **Body**:

```json
{
  "name": "Lập trình Mobile",
  "description": "Các khóa học về mobile"
}
```

### 4.1.2 Sửa danh mục

- **Method**: `PUT`
- **Endpoint**: `/admin/categories/:categoryId`
- **Body**:

```json
{
  "name": "Tên danh mục đã sửa",
  "description": "Mô tả mới"
}
```

### 4.1.3 Xóa danh mục

- **Method**: `DELETE`
- **Endpoint**: `/admin/categories/:categoryId`

## 4.2 Khóa học

### 4.2.1 Lấy chi tiết khóa học (admin)

- **Method**: `GET`
- **Endpoint**: `/admin/courses/:courseId`

### 4.2.2 Tạo khóa học (multipart)

- **Method**: `POST`
- **Endpoint**: `/admin/courses`
- **Content-Type**: `multipart/form-data`
- **Form-data fields**:
  - `title` (text)
  - `price` (text)
  - `category_id` (text)
  - `description` (text)
  - `image` (file, tùy chọn)

### 4.2.3 Sửa khóa học (multipart)

- **Method**: `PUT`
- **Endpoint**: `/admin/courses/:courseId`
- **Content-Type**: `multipart/form-data`
- **Form-data fields**:
  - `title` (text)
  - `price` (text)
  - `category_id` (text)
  - `description` (text)
  - `image` (file, tùy chọn)

### 4.2.4 Xóa khóa học

- **Method**: `DELETE`
- **Endpoint**: `/admin/courses/:courseId`

## 4.3 Bài giảng

### 4.3.1 Thêm bài giảng (multipart)

- **Method**: `POST`
- **Endpoint**: `/admin/lessons`
- **Content-Type**: `multipart/form-data`
- **Form-data fields**:
  - `course_id` (text)
  - `title` (text)
  - `order_index` (text)
  - `video` (file)

### 4.3.2 Sửa bài giảng (multipart)

- **Method**: `PUT`
- **Endpoint**: `/admin/lessons/:lessonId`
- **Content-Type**: `multipart/form-data`
- **Form-data fields**:
  - `title` (text)
  - `order_index` (text)
  - `video` (file, tùy chọn)

### 4.3.3 Xóa bài giảng

- **Method**: `DELETE`
- **Endpoint**: `/admin/lessons/:lessonId`

## 4.4 Học viên

### 4.4.1 Danh sách học viên (mới nhất)

- **Method**: `GET`
- **Endpoint**: `/admin/students?sort=newest`

### 4.4.2 Danh sách học viên (cũ nhất)

- **Method**: `GET`
- **Endpoint**: `/admin/students?sort=oldest`

### 4.4.3 Chi tiết học viên

- **Method**: `GET`
- **Endpoint**: `/admin/students/:studentId`

## 4.5 Đánh giá

### 4.5.1 Xóa đánh giá

- **Method**: `DELETE`
- **Endpoint**: `/admin/reviews/:reviewId`

---

## 5) Student APIs (`Bearer {{studentToken}}`)

### 5.1 Mua khóa học

- **Method**: `POST`
- **Endpoint**: `/student/enroll`
- **Body**:

```json
{
  "course_id": 1
}
```

### 5.2 Xem khóa học đã mua

- **Method**: `GET`
- **Endpoint**: `/student/my-courses`

### 5.3 Xem video bài giảng

- **Method**: `GET`
- **Endpoint**: `/student/lessons/:lessonId/video`

### 5.4 Đánh giá khóa học

- **Method**: `POST`
- **Endpoint**: `/student/reviews`
- **Body**:

```json
{
  "course_id": 1,
  "rating": 5,
  "comment": "Khóa học rất hay và dễ hiểu!"
}
```

### 5.5 Cập nhật thông tin cá nhân

- **Method**: `PUT`
- **Endpoint**: `/student/profile`
- **Body**:

```json
{
  "full_name": "Nguyễn Văn A đã cập nhật"
}
```

### 5.6 Đổi mật khẩu

- **Method**: `PUT`
- **Endpoint**: `/student/change-password`
- **Body**:

```json
{
  "old_password": "123456",
  "new_password": "newpassword123"
}
```

---

## 6) Thứ tự test nhanh trên Postman (gợi ý)

1. `POST /auth/login` (admin) để lấy `adminToken`
2. `POST /auth/login` (student) để lấy `studentToken`
3. Chạy nhóm Public
4. Chạy nhóm Admin (tạo danh mục -> tạo khóa học -> tạo bài giảng)
5. Chạy nhóm Student (mua khóa học -> xem bài giảng -> đánh giá)
