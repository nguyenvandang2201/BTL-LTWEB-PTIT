/**
 * @file errorMiddleware.js
 * @description Middleware xử lý lỗi tập trung cho toàn bộ ứng dụng Express.
 *
 * Bao gồm 2 middleware nên được đăng ký cuối cùng trong chuỗi middleware của app:
 *  1. notFound     : Bắt tất cả request đến URL không tồn tại, tạo lỗi 404
 *                    và chuyển tiếp cho errorHandler.
 *  2. errorHandler : Xử lý mọi lỗi được chuyển tiếp qua next(error), trả về
 *                    JSON chuẩn; ở môi trường non-production sẽ kèm stack trace
 *                    để hỗ trợ debug.
 *
 * Cách đăng ký trong app.js (phải đặt sau tất cả route):
 *   app.use(notFound);
 *   app.use(errorHandler);
 */

import { isProduction } from '../config/env.js';

/**
 * @function notFound
 * @description Middleware bắt các request đến route không tồn tại (404 Not Found).
 *
 * Được đặt sau tất cả route definitions trong app. Khi không có route nào khớp,
 * middleware này tạo một đối tượng Error chứa thông báo và URL bị gọi sai,
 * đặt status code là 404, sau đó chuyển lỗi sang errorHandler qua next(error).
 *
 * @param {import('express').Request}      req  - Request chứa originalUrl để ghi vào thông báo lỗi.
 * @param {import('express').Response}     res  - Response; chỉ dùng để set status code 404.
 * @param {import('express').NextFunction} next - Chuyển Error object sang errorHandler.
 *
 * @returns {void} Luôn gọi next(error), không tự trả response.
 */
export const notFound = (req, res, next) => {
  // Tạo Error object với thông báo chứa URL thực tế mà client đã gọi.
  const error = new Error(`Không tìm thấy đường dẫn: ${req.originalUrl}`);
  // Đặt status code 404 lên response để errorHandler sử dụng.
  res.status(404);
  // Chuyển lỗi sang errorHandler, không tự kết thúc response tại đây.
  next(error);
};

/**
 * @function errorHandler
 * @description Middleware xử lý lỗi tập trung (Error-handling middleware của Express).
 *
 * Express nhận biết đây là error-handling middleware nhờ có đúng 4 tham số (err, req, res, next).
 *
 * Luồng xử lý:
 *  1. Xác định status code phù hợp:
 *     - Nếu res.statusCode vẫn là 200 (chưa được set trước đó) → dùng 500 (Internal Server Error).
 *     - Ngược lại → giữ nguyên status code đã set (ví dụ: 404 từ notFound).
 *  2. Trả về JSON chứa message lỗi.
 *  3. Ở môi trường non-production (development/test): bổ sung stack trace vào response
 *     để lập trình viên có thể debug nhanh hơn.
 *     Ở production: ẩn stack trace để tránh lộ thông tin nội bộ.
 *
 * @param {Error}                          err  - Đối tượng lỗi được chuyển tiếp qua next(error).
 * @param {import('express').Request}      req  - Request (không dùng trực tiếp, nhưng bắt buộc có đủ 4 tham số).
 * @param {import('express').Response}     res  - Response để trả JSON lỗi về client.
 * @param {import('express').NextFunction} next - Không dùng, nhưng phải khai báo để Express nhận dạng error middleware.
 *
 * @returns {void} Kết thúc response với JSON { message, stack? }.
 */
export const errorHandler = (err, req, res, next) => {
  // Nếu status code vẫn là 200 (mặc định) dù có lỗi xảy ra, chuyển sang 500.
  // Trường hợp này xảy ra khi lỗi được throw trực tiếp mà chưa set status trước.
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    // Thông điệp lỗi chính từ Error object.
    message: err.message,
    // Chỉ đính kèm stack trace ở môi trường non-production (development/test) để hỗ trợ debug.
    // Ở production, stack bị ẩn để tránh lộ chi tiết cấu trúc nội bộ ứng dụng.
    ...(!isProduction && { stack: err.stack }),
  });
};
