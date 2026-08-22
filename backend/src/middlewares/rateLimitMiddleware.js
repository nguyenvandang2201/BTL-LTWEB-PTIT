/**
 * @file rateLimitMiddleware.js
 * @description Middleware giới hạn tần suất request (rate limiting) theo địa chỉ IP.
 *
 * Mục đích:
 *  - Giảm thiểu tấn công brute-force vào endpoint đăng nhập / đăng ký.
 *  - Bảo vệ server khỏi việc bị gọi API dồn dập gây quá tải.
 *
 * Module export hai limiter với mức độ nghiêm ngặt khác nhau:
 *  - `apiLimiter`  : áp dụng cho toàn bộ nhánh `/api`, hạn mức rộng rãi.
 *  - `authLimiter` : áp dụng riêng cho `/api/auth`, hạn mức chặt hơn nhiều.
 *
 * Phụ thuộc:
 *  - express-rate-limit : Thư viện rate limit cho Express.
 */

import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/** Độ dài cửa sổ rate limit, quy đổi từ phút (biến môi trường) sang mili-giây. */
const WINDOW_MS = env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;

/**
 * Limiter mặc định cho toàn bộ API.
 *
 * Cấu hình:
 *  - `windowMs`        : độ dài cửa sổ đếm request.
 *  - `limit`           : số request tối đa mỗi IP trong một cửa sổ.
 *  - `standardHeaders` : trả về header `RateLimit-*` theo chuẩn IETF.
 *  - `legacyHeaders`   : tắt các header `X-RateLimit-*` đã lỗi thời.
 *
 * @type {import('express').RequestHandler}
 */
export const apiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Bạn đã gửi quá nhiều request. Vui lòng thử lại sau ít phút.',
  },
});

/**
 * Limiter nghiêm ngặt dành cho các endpoint xác thực (đăng nhập, đăng ký).
 *
 * Hạn mức thấp hơn nhiều so với `apiLimiter` vì đây là mục tiêu chính của
 * tấn công dò mật khẩu. `skipSuccessfulRequests` đảm bảo người dùng hợp lệ
 * đăng nhập thành công không bị tính vào hạn mức.
 *
 * @type {import('express').RequestHandler}
 */
export const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    message:
      'Bạn đã thử đăng nhập/đăng ký quá nhiều lần. Vui lòng thử lại sau ít phút.',
  },
});
