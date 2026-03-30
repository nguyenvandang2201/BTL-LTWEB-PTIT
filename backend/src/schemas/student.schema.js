/**
 * @file student.schema.js
 * @description Tập hợp các Zod schema dùng để xác thực dữ liệu đầu vào cho các API học viên (Student).
 *
 * Mỗi schema được truyền vào middleware `validate()` trong studentRoutes.js
 * để kiểm tra req.body trước khi request đến controller.
 *
 * Danh sách schema:
 *  - enrollSchema         : Xác thực body khi đăng ký (mua) khóa học.
 *  - reviewSchema         : Xác thực body khi gửi đánh giá khóa học.
 *  - updateProfileSchema  : Xác thực body khi cập nhật hồ sơ cá nhân.
 *  - changePasswordSchema : Xác thực body khi đổi mật khẩu.
 *
 * Lưu ý kỹ thuật so với admin.schema.js:
 *  - Các trường số ở đây dùng z.number() thay vì z.coerce.number(),
 *    vì student routes gửi JSON thuần (application/json) chứ không phải multipart/form-data,
 *    nên kiểu dữ liệu đã là number từ phía client — không cần ép kiểu từ string.
 *
 * Phụ thuộc:
 *  - zod : Thư viện schema validation TypeScript-first.
 */

import { z } from 'zod';

/**
 * @constant enrollSchema
 * @description Schema xác thực body khi học viên đăng ký (mua) một khóa học.
 *
 * Ràng buộc từng trường:
 *  - course_id {number, bắt buộc} : ID khóa học cần đăng ký.
 *                                   Phải là số nguyên dương (int + positive) —
 *                                   loại bỏ các giá trị 0, âm, hoặc số thập phân.
 *
 * Nếu không hợp lệ, middleware validate() sẽ trả về HTTP 400 kèm mảng errors của Zod.
 *
 * Dùng tại route: POST /api/student/enroll
 */
export const enrollSchema = z.object({
  course_id: z.number().int().positive('course_id phải là số nguyên dương'),
});

/**
 * @constant reviewSchema
 * @description Schema xác thực body khi học viên gửi đánh giá cho khóa học đã mua.
 *
 * Ràng buộc từng trường:
 *  - course_id {number, bắt buộc} : ID khóa học được đánh giá, phải là số nguyên dương.
 *  - rating    {number, bắt buộc} : Điểm đánh giá theo thang 1–5.
 *                                   int() đảm bảo không nhận số thập phân (ví dụ: 3.5).
 *                                   min(1) và max(5) giới hạn khoảng giá trị hợp lệ.
 *  - comment   {string, bắt buộc} : Nội dung bình luận, không được để trống (min 1 ký tự).
 *
 * Nếu không hợp lệ, middleware validate() sẽ trả về HTTP 400 kèm mảng errors của Zod.
 *
 * Dùng tại route: POST /api/student/reviews
 */
export const reviewSchema = z.object({
  course_id: z.number().int().positive('course_id phải là số nguyên dương'),
  rating: z.number().int().min(1, 'Rating tối thiểu là 1').max(5, 'Rating tối đa là 5'),
  comment: z.string().min(1, 'Bình luận không được để trống'),
});

/**
 * @constant updateProfileSchema
 * @description Schema xác thực body khi học viên cập nhật thông tin hồ sơ cá nhân.
 *
 * Hiện tại chỉ cho phép cập nhật họ tên. Các trường nhạy cảm như email và role
 * không được phép chỉnh sửa qua API này để đảm bảo an toàn.
 *
 * Ràng buộc từng trường:
 *  - full_name {string, bắt buộc} : Họ tên mới của người dùng, không được để trống.
 *
 * Nếu không hợp lệ, middleware validate() sẽ trả về HTTP 400 kèm mảng errors của Zod.
 *
 * Dùng tại route: PUT /api/student/profile
 */
export const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Họ tên không được để trống'),
});

/**
 * @constant changePasswordSchema
 * @description Schema xác thực body khi học viên đổi mật khẩu.
 *
 * Cả hai trường đều yêu cầu tối thiểu 6 ký tự nhất quán với quy tắc đặt mật khẩu
 * khi đăng ký (registerSchema), giúp ngăn đặt mật khẩu mới quá ngắn.
 *
 * Ràng buộc từng trường:
 *  - old_password {string, bắt buộc} : Mật khẩu hiện tại để xác minh danh tính,
 *                                      tối thiểu 6 ký tự (khớp với ràng buộc đặt mật khẩu ban đầu).
 *  - new_password {string, bắt buộc} : Mật khẩu mới muốn đặt, tối thiểu 6 ký tự.
 *
 * Lưu ý: Schema không kiểm tra old_password ≠ new_password; logic này được xử lý ở controller
 * nếu cần thiết về mặt nghiệp vụ.
 *
 * Nếu không hợp lệ, middleware validate() sẽ trả về HTTP 400 kèm mảng errors của Zod.
 *
 * Dùng tại route: PUT /api/student/change-password
 */
export const changePasswordSchema = z.object({
  old_password: z.string().min(6, 'Mật khẩu cũ phải có ít nhất 6 ký tự'),
  new_password: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});
