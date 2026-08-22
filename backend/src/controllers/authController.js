/**
 * @file authController.js
 * @description Controller xử lý xác thực người dùng (Authentication).
 *
 * Bao gồm 2 chức năng chính:
 *  - register: Đăng ký tài khoản mới với vai trò mặc định là 'student'.
 *  - login   : Đăng nhập và cấp JWT token cho phiên làm việc trong 1 ngày.
 *
 * Mật khẩu được băm (hash) bằng bcrypt trước khi lưu vào CSDL.
 * JWT được ký bằng biến môi trường JWT_SECRET và chứa userId + role.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { env } from '../config/env.js';

/** Số vòng salt dùng khi băm mật khẩu bằng bcrypt. Giá trị 10 là mức cân bằng giữa bảo mật và hiệu năng. */
const SALT_ROUNDS = 10;

/**
 * @function register
 * @description Đăng ký tài khoản người dùng mới.
 *
 * Luồng xử lý:
 *  1. Lấy full_name, email, password từ body request.
 *  2. Kiểm tra email đã tồn tại trong CSDL chưa → trả 400 nếu trùng.
 *  3. Băm mật khẩu bằng bcrypt với SALT_ROUNDS.
 *  4. Tạo bản ghi user mới với role mặc định là 'student'.
 *  5. Trả 201 khi tạo thành công.
 *
 * @route  POST /api/auth/register
 * @access Public
 *
 * @param {import('express').Request}  req - Request chứa body { full_name, email, password }.
 * @param {import('express').Response} res - Response JSON { message }.
 *
 * @returns {201} Đăng ký thành công.
 * @returns {400} Email đã được sử dụng.
 * @returns {500} Lỗi máy chủ.
 */
export const register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    // Kiểm tra email đã tồn tại chưa để tránh trùng lặp tài khoản.
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email này đã được sử dụng' });
    }

    // Băm mật khẩu trước khi lưu vào CSDL, tuyệt đối không lưu plain text.
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Tạo user mới với vai trò mặc định là 'student'.
    await prisma.user.create({
      data: {
        full_name,
        email,
        password: hashedPassword,
        role: 'student',
      },
    });

    return res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * @function login
 * @description Đăng nhập và trả về JWT token cùng vai trò người dùng.
 *
 * Luồng xử lý:
 *  1. Lấy email, password từ body request.
 *  2. Tìm user theo email → trả 404 nếu không tồn tại.
 *  3. So sánh password nhập vào với hash trong CSDL bằng bcrypt.compare → trả 401 nếu sai.
 *  4. Ký JWT với payload { userId, role }, thời hạn 1 ngày, dùng JWT_SECRET từ env.
 *  5. Trả token và role về cho client để lưu và sử dụng cho các request tiếp theo.
 *
 * @route  POST /api/auth/login
 * @access Public
 *
 * @param {import('express').Request}  req - Request chứa body { email, password }.
 * @param {import('express').Response} res - Response JSON { token, role }.
 *
 * @returns {200} Đăng nhập thành công, trả về { token, role }.
 * @returns {404} Tài khoản không tồn tại.
 * @returns {401} Sai mật khẩu.
 * @returns {500} Lỗi máy chủ.
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm user theo email; nếu không có → thông báo tài khoản không tồn tại.
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại' });
    }

    // So khớp mật khẩu nhập vào với hash đã lưu trong CSDL.
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Sai mật khẩu' });
    }

    // Tạo JWT token chứa userId và role, hết hạn sau 1 ngày.
    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    // Trả token và role về client để lưu trữ (localStorage/cookie) và phân quyền giao diện.
    return res.status(200).json({ token, role: user.role });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};
