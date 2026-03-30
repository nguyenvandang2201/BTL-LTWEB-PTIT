/**
 * @file validateMiddleware.js
 * @description Middleware xác thực dữ liệu đầu vào (request body) dùng thư viện Zod.
 *
 * Cung cấp một hàm factory `validate(schema)` nhận vào một Zod schema và trả về
 * một Express middleware. Middleware này kiểm tra req.body theo schema trước khi
 * chuyển request đến controller — đảm bảo controller chỉ nhận dữ liệu đã hợp lệ.
 *
 * Cách sử dụng trong route:
 *   import { validate } from '../middlewares/validateMiddleware.js';
 *   import { registerSchema } from '../validators/authValidator.js';
 *
 *   router.post('/register', validate(registerSchema), register);
 *
 * Phụ thuộc:
 *  - zod (ZodError) : Thư viện schema validation với TypeScript-first design.
 */

import { ZodError } from 'zod';

/**
 * @function validate
 * @description Factory function tạo middleware xác thực req.body theo một Zod schema cho trước.
 *
 * Luồng xử lý của middleware được trả về:
 *  1. Gọi schema.parse(req.body) để xác thực dữ liệu body theo schema Zod.
 *  2. Nếu hợp lệ → gọi next() để chuyển sang controller tiếp theo.
 *  3. Nếu không hợp lệ và lỗi là ZodError → trả 400 kèm mảng errors chi tiết
 *     (chứa thông tin từng trường bị sai: path, message, code, ...).
 *  4. Nếu lỗi là loại khác (không phải ZodError, ví dụ lỗi runtime) → chuyển lỗi
 *     đến error-handling middleware qua next(error).
 *
 * @param {import('zod').ZodTypeAny} schema - Schema Zod dùng để xác thực req.body.
 *
 * @returns {import('express').RequestHandler} Middleware Express xác thực dữ liệu đầu vào.
 *
 * @example
 * // Định nghĩa schema Zod
 * const loginSchema = z.object({
 *   email   : z.string().email(),
 *   password: z.string().min(6),
 * });
 *
 * // Áp dụng vào route
 * router.post('/login', validate(loginSchema), login);
 *
 * @returns {400} Body không hợp lệ theo schema; kèm mảng errors từ Zod.
 * @returns {void} Gọi next() nếu body hợp lệ, hoặc next(error) nếu lỗi không xác định.
 */
export const validate = (schema) => (req, res, next) => {
  try {
    // Phân tích và xác thực toàn bộ req.body theo schema Zod được cung cấp.
    // Nếu hợp lệ, parse() trả về dữ liệu đã được sanitize; nếu không, ném ZodError.
    schema.parse(req.body);
    // Dữ liệu hợp lệ → chuyển sang bước tiếp theo trong chuỗi middleware.
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      // ZodError chứa mảng errors với thông tin chi tiết từng trường bị lỗi:
      // path (tên trường), message (mô tả lỗi), code (loại lỗi Zod).
      return res.status(400).json({ errors: error.errors });
    }
    // Lỗi không phải ZodError (ví dụ: lỗi runtime không mong muốn) → chuyển sang errorHandler.
    next(error);
  }
};
