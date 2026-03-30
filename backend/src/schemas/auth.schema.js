/**
 * @file auth.schema.js
 * @description Tập hợp các Zod schema dùng để xác thực dữ liệu đầu vào cho các API xác thực (Auth).
 *
 * Mỗi schema được truyền vào middleware `validate()` trong authRoutes.js
 * để kiểm tra req.body trước khi request đến controller.
 *
 * Danh sách schema:
 *  - registerSchema : Xác thực dữ liệu đăng ký tài khoản mới.
 *  - loginSchema    : Xác thực dữ liệu đăng nhập.
 *
 * Phụ thuộc:
 *  - zod : Thư viện schema validation TypeScript-first.
 */

import { z } from 'zod';

/**
 * @constant registerSchema
 * @description Schema xác thực body khi đăng ký tài khoản mới.
 *
 * Ràng buộc từng trường:
 *  - full_name {string, bắt buộc} : Họ và tên đầy đủ của người dùng.
 *                                   min(1) đảm bảo không được gửi chuỗi rỗng "".
 *  - email     {string, bắt buộc} : Địa chỉ email hợp lệ theo định dạng chuẩn (RFC 5322).
 *                                   z.string().email() kiểm tra cả cấu trúc lẫn ký tự đặc biệt.
 *  - password  {string, bắt buộc} : Mật khẩu tối thiểu 6 ký tự để đảm bảo mức độ an toàn cơ bản.
 *
 * Nếu bất kỳ trường nào không hợp lệ, middleware validate() sẽ trả về
 * HTTP 400 kèm mảng errors chi tiết của Zod (field path + message).
 *
 * Dùng tại route: POST /api/auth/register
 */
export const registerSchema = z.object({
  full_name: z.string().min(1, 'Họ tên không được để trống'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

/**
 * @constant loginSchema
 * @description Schema xác thực body khi đăng nhập.
 *
 * Ràng buộc từng trường:
 *  - email    {string, bắt buộc} : Địa chỉ email hợp lệ để tìm tài khoản trong CSDL.
 *  - password {string, bắt buộc} : Mật khẩu không được để trống (min 1).
 *                                  Không đặt min(6) ở đây để cho phép thông báo lỗi
 *                                  "sai mật khẩu" trả về từ controller thay vì lỗi validation.
 *
 * Nếu bất kỳ trường nào không hợp lệ, middleware validate() sẽ trả về
 * HTTP 400 kèm mảng errors chi tiết của Zod (field path + message).
 *
 * Dùng tại route: POST /api/auth/login
 */
export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});
