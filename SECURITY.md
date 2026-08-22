# Chính sách bảo mật

## Báo cáo lỗ hổng

Nếu bạn phát hiện lỗ hổng bảo mật trong dự án, vui lòng **không** tạo issue công khai.
Thay vào đó hãy liên hệ trực tiếp với người bảo trì repository để lỗ hổng được xử lý
trước khi công bố.

Khi báo cáo, cố gắng cung cấp:

- Mô tả lỗ hổng và mức độ ảnh hưởng.
- Các bước tái hiện hoặc mã khai thác minh hoạ.
- Phiên bản / commit bị ảnh hưởng.

---

## Thực hành bảo mật trong dự án

| Hạng mục            | Cách xử lý hiện tại                                                        |
| ------------------- | -------------------------------------------------------------------------- |
| Mật khẩu            | Băm bằng `bcrypt` với 10 vòng salt, không bao giờ lưu dạng plain text.      |
| Xác thực            | JWT ký bằng `JWT_SECRET` (bắt buộc tối thiểu 32 ký tự), mặc định hết hạn 1 ngày. |
| Phân quyền          | `verifyToken` bảo vệ nhóm student; `verifyToken` + `isAdmin` bảo vệ nhóm admin. |
| Validate đầu vào    | Toàn bộ request body được kiểm tra bằng schema Zod trước khi vào controller.|
| HTTP headers        | `helmet` thiết lập các header bảo mật tiêu chuẩn.                           |
| CORS                | Chỉ cho phép origin khai báo trong biến môi trường `CORS_ORIGIN`.           |
| Rate limiting       | Giới hạn theo IP cho toàn bộ `/api`, siết chặt hơn ở `/api/auth`.           |
| Rò rỉ thông tin     | Stack trace chỉ hiển thị ở môi trường non-production.                       |
| Biến môi trường     | Xác thực bằng Zod lúc khởi động; `.env` bị loại khỏi Git.                   |
| API key AI          | Gemini/DeepSeek chỉ đọc phía server, không bao giờ gửi xuống client.        |
| Chi phí dịch vụ AI  | Endpoint chatbot yêu cầu đăng nhập, kiểm tra quyền học và giới hạn 10 câu hỏi/phút theo tài khoản. |

---

## Trước khi triển khai production

- [ ] Sinh `JWT_SECRET` ngẫu nhiên, dài tối thiểu 32 ký tự và khác hoàn toàn môi trường dev.
- [ ] Đặt `NODE_ENV=production`.
- [ ] Giới hạn `CORS_ORIGIN` đúng tên miền frontend thật, không dùng `*`.
- [ ] Bật SSL cho kết nối PostgreSQL.
- [ ] Đổi mật khẩu của mọi tài khoản được tạo bởi script seed.
- [ ] Rà soát lại `RATE_LIMIT_MAX` cho phù hợp lưu lượng thực tế.
- [ ] Đặt hạn mức chi tiêu (budget alert) trên tài khoản Google AI Studio và DeepSeek.
