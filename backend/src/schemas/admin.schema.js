/**
 * @file admin.schema.js
 * @description Tập hợp các Zod schema dùng để xác thực dữ liệu đầu vào cho các API quản trị (Admin).
 *
 * Mỗi schema được truyền vào middleware `validate()` trong adminRoutes.js
 * để kiểm tra req.body trước khi request đến controller.
 *
 * Có 2 nhóm schema:
 *  - Schema TẠO MỚI (Create): Các trường bắt buộc có ràng buộc chặt chẽ.
 *    + categorySchema    : Tạo danh mục mới.
 *    + courseSchema      : Tạo khóa học mới (kèm upload ảnh qua Multer).
 *    + lessonSchema      : Tạo bài học mới (kèm upload video qua Multer).
 *
 *  - Schema CẬP NHẬT (Update): Tất cả trường là optional — cho phép cập nhật từng phần (partial update).
 *    + updateCategorySchema : Cập nhật danh mục.
 *    + updateCourseSchema   : Cập nhật khóa học.
 *    + updateLessonSchema   : Cập nhật bài học.
 *
 * Lưu ý kỹ thuật:
 *  - z.coerce.number() : Tự động ép kiểu string → number, cần thiết vì multipart/form-data
 *    gửi tất cả giá trị dưới dạng string kể cả số nguyên.
 *  - .optional()       : Cho phép trường vắng mặt hoặc undefined (dùng cho update schema).
 *
 * Phụ thuộc:
 *  - zod : Thư viện schema validation TypeScript-first.
 */

import { z } from 'zod';

/**
 * @constant categorySchema
 * @description Schema xác thực body khi TẠO MỚI một danh mục khóa học.
 *
 * Ràng buộc:
 *  - name        {string, bắt buộc} : Tên danh mục, không được để trống (min 1 ký tự).
 *  - description {string, tùy chọn}: Mô tả danh mục, có thể bỏ qua.
 *
 * Dùng tại route: POST /api/admin/categories
 */
export const categorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống'),
  description: z.string().optional(),
});

/**
 * @constant courseSchema
 * @description Schema xác thực body khi TẠO MỚI một khóa học.
 *
 * Lưu ý: Route này dùng multipart/form-data (kèm file ảnh), nên các trường số
 * (price, category_id) được gửi dạng string → cần z.coerce.number() để ép kiểu tự động.
 *
 * Ràng buộc:
 *  - title       {string, bắt buộc} : Tiêu đề khóa học, không được để trống.
 *  - price       {number, bắt buộc} : Giá khóa học, ép kiểu từ string, không được âm (min 0).
 *  - category_id {number, bắt buộc} : ID danh mục, ép kiểu từ string, phải là số nguyên.
 *  - description {string, tùy chọn}: Mô tả khóa học, có thể bỏ qua.
 *  - image_url   {string, tùy chọn}: URL ảnh đại diện (thường do Multer/Cloudinary xử lý và ghi đè ở controller).
 *
 * Dùng tại route: POST /api/admin/courses
 */
export const courseSchema = z.object({
  title: z.string().min(1, 'Tiêu đề khóa học không được để trống'),
  price: z.coerce.number().min(0, 'Giá không được âm'),
  category_id: z.coerce.number().int('category_id phải là số nguyên'),
  description: z.string().optional(),
  image_url: z.string().optional(),
});

/**
 * @constant lessonSchema
 * @description Schema xác thực body khi TẠO MỚI một bài học.
 *
 * Lưu ý: Route này dùng multipart/form-data (kèm file video), nên các trường số
 * (course_id, order_index) được gửi dạng string → cần z.coerce.number() để ép kiểu tự động.
 *
 * Ràng buộc:
 *  - course_id   {number, bắt buộc} : ID khóa học chứa bài học, ép kiểu từ string, phải là số nguyên.
 *  - title       {string, bắt buộc} : Tiêu đề bài học, không được để trống.
 *  - order_index {number, bắt buộc} : Thứ tự sắp xếp bài học trong khóa học, ép kiểu từ string, phải là số nguyên.
 *
 * Dùng tại route: POST /api/admin/lessons
 */
export const lessonSchema = z.object({
  course_id: z.coerce.number().int('course_id phải là số nguyên'),
  title: z.string().min(1, 'Tiêu đề bài giảng không được để trống'),
  order_index: z.coerce.number().int('order_index phải là số nguyên'),
  content: z.string().optional(),
});

/**
 * @constant updateCategorySchema
 * @description Schema xác thực body khi CẬP NHẬT một danh mục khóa học (partial update).
 *
 * Tất cả trường đều optional — client chỉ cần gửi các trường muốn thay đổi.
 * Nếu không gửi trường nào, schema vẫn hợp lệ nhưng controller sẽ không cập nhật gì.
 *
 * Ràng buộc:
 *  - name        {string, tùy chọn}: Tên danh mục mới.
 *  - description {string, tùy chọn}: Mô tả danh mục mới.
 *
 * Dùng tại route: PUT /api/admin/categories/:id
 */
export const updateCategorySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

/**
 * @constant updateCourseSchema
 * @description Schema xác thực body khi CẬP NHẬT một khóa học (partial update).
 *
 * Tất cả trường đều optional. Route dùng multipart/form-data nên các trường số
 * vẫn cần z.coerce.number() để ép kiểu nếu được gửi.
 *
 * Ràng buộc:
 *  - title       {string, tùy chọn}: Tiêu đề khóa học mới.
 *  - price       {number, tùy chọn}: Giá mới, ép kiểu từ string, không được âm nếu có.
 *  - category_id {number, tùy chọn}: ID danh mục mới, ép kiểu từ string, phải là số nguyên nếu có.
 *  - description {string, tùy chọn}: Mô tả mới.
 *  - image_url   {string, tùy chọn}: URL ảnh mới (thường do controller ghi đè từ Cloudinary).
 *
 * Dùng tại route: PUT /api/admin/courses/:id
 */
export const updateCourseSchema = z.object({
  title: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  category_id: z.coerce.number().int().optional(),
  description: z.string().optional(),
  image_url: z.string().optional(),
});

/**
 * @constant updateLessonSchema
 * @description Schema xác thực body khi CẬP NHẬT một bài học (partial update).
 *
 * Tất cả trường đều optional. Không bao gồm course_id vì bài học không được
 * chuyển sang khóa học khác sau khi tạo.
 *
 * Ràng buộc:
 *  - title       {string, tùy chọn}: Tiêu đề bài học mới.
 *  - order_index {number, tùy chọn}: Thứ tự mới, ép kiểu từ string, phải là số nguyên nếu có.
 *
 * Dùng tại route: PUT /api/admin/lessons/:id
 */
export const updateLessonSchema = z.object({
  title: z.string().optional(),
  order_index: z.coerce.number().int().optional(),
  content: z.string().nullable().optional(),
});
