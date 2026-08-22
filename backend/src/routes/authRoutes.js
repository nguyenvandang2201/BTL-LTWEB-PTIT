/**
 * @file authRoutes.js
 * @description Định nghĩa các route API xác thực người dùng (Authentication).
 *
 * Tất cả route trong file này đều công khai (Public) — không yêu cầu JWT.
 * Dữ liệu đầu vào được xác thực bằng Zod schema trước khi chuyển đến controller.
 *
 * Danh sách route:
 *  - POST /register : Đăng ký tài khoản mới (validate → register).
 *  - POST /login    : Đăng nhập và nhận JWT token (validate → login).
 *
 * Prefix đăng ký trong app.js: /api/auth
 */

import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { authLimiter } from '../middlewares/rateLimitMiddleware.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';

const router = Router();

/**
 * @route  POST /api/auth/register
 * @desc   Đăng ký tài khoản người dùng mới với vai trò mặc định là 'student'.
 *         Body được xác thực bằng registerSchema (Zod) trước khi vào controller.
 *         registerSchema kiểm tra: full_name (string), email (email hợp lệ), password (độ dài tối thiểu).
 * @access Public
 * @middleware validate(registerSchema) → register
 * @body    { full_name: string, email: string, password: string }
 * @returns {201} Đăng ký thành công.
 * @returns {400} Dữ liệu không hợp lệ (Zod) hoặc email đã tồn tại.
 */
router.post('/register', authLimiter, validate(registerSchema), register);

/**
 * @route  POST /api/auth/login
 * @desc   Đăng nhập bằng email và mật khẩu, nhận JWT token và vai trò người dùng.
 *         Body được xác thực bằng loginSchema (Zod) trước khi vào controller.
 *         loginSchema kiểm tra: email (email hợp lệ), password (không rỗng).
 * @access Public
 * @middleware validate(loginSchema) → login
 * @body    { email: string, password: string }
 * @returns {200} Đăng nhập thành công, trả về { token, role }.
 * @returns {400} Dữ liệu không hợp lệ (Zod).
 * @returns {401} Sai mật khẩu.
 * @returns {404} Tài khoản không tồn tại.
 */
router.post('/login', authLimiter, validate(loginSchema), login);

export default router;
