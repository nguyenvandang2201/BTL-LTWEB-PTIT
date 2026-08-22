/**
 * @file authMiddleware.js
 * @description Middleware xác thực JWT (JSON Web Token) cho các route được bảo vệ.
 *
 * Middleware này kiểm tra sự tồn tại và tính hợp lệ của Bearer token
 * trong header Authorization của mỗi request. Nếu hợp lệ, thông tin
 * người dùng đã giải mã (userId, role) sẽ được gắn vào req.user để
 * các middleware và controller phía sau có thể sử dụng.
 *
 * Thứ tự sử dụng trong pipeline:
 *   route → verifyToken → roleMiddleware → controller
 *
 * Phụ thuộc:
 *  - jsonwebtoken : Giải mã và xác thực chữ ký JWT.
 *  - JWT_SECRET   : Biến môi trường chứa khóa bí mật để xác minh chữ ký token.
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * @function verifyToken
 * @description Middleware xác thực Bearer JWT token từ header Authorization.
 *
 * Luồng xử lý:
 *  1. Đọc giá trị header Authorization (dạng "Bearer <token>").
 *  2. Tách phần token sau "Bearer " bằng split(' ')[1].
 *  3. Nếu không có token → trả 401 (Unauthorized).
 *  4. Dùng jwt.verify() để giải mã và xác thực chữ ký token với JWT_SECRET.
 *  5. Nếu hợp lệ → gắn payload đã giải mã vào req.user rồi gọi next().
 *  6. Nếu token sai chữ ký hoặc hết hạn → trả 403 (Forbidden).
 *
 * @param {import('express').Request}  req  - Request; cần có header Authorization: Bearer <token>.
 * @param {import('express').Response} res  - Response JSON { message }.
 * @param {import('express').NextFunction} next - Hàm chuyển sang middleware/controller tiếp theo.
 *
 * @returns {void} Gọi next() nếu token hợp lệ; kết thúc response nếu không.
 *
 * @sideEffect Gán req.user = { userId, role, ... } (payload của JWT) nếu xác thực thành công.
 *
 * @returns {401} Không tìm thấy token trong header.
 * @returns {403} Token không hợp lệ hoặc đã hết hạn.
 */
export const verifyToken = (req, res, next) => {
  // Lấy toàn bộ giá trị header Authorization (ví dụ: "Bearer eyJhbGci...").
  const authHeader = req.headers['authorization'];
  // Tách token ra khỏi prefix "Bearer "; nếu header không tồn tại thì token = undefined.
  const token = authHeader && authHeader.split(' ')[1];

  // Nếu không có token, trả 401 - client chưa cung cấp thông tin xác thực.
  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy token truy cập' });
  }

  try {
    // Xác thực chữ ký và giải mã payload của token bằng JWT_SECRET từ biến môi trường.
    // Nếu token hết hạn hoặc bị giả mạo, jwt.verify() sẽ ném ngoại lệ.
    const decoded = jwt.verify(token, env.JWT_SECRET);
    // Gắn payload đã giải mã vào req.user để các middleware/controller sau sử dụng.
    req.user = decoded;
    next();
  } catch (_error) {
    // Token bị giả mạo (sai chữ ký) hoặc đã hết hạn → từ chối truy cập với 403.
    return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};
