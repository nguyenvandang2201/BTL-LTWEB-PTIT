/**
 * @file index.js
 * @description Điểm khởi động (entry point) của backend.
 *
 * Trách nhiệm của file này chỉ xoay quanh vòng đời của tiến trình server:
 *  1. Mở cổng lắng nghe HTTP.
 *  2. Bắt các tín hiệu dừng (SIGINT/SIGTERM) để tắt server một cách "duyên dáng".
 *  3. Bắt các lỗi không được xử lý (unhandledRejection / uncaughtException).
 *
 * Toàn bộ cấu hình Express (middleware, routes, error handler) nằm ở `src/app.js`.
 */

import app from './app.js';
import prisma from './config/prisma.js';
import { env } from './config/env.js';

/** Server HTTP đang lắng nghe, giữ tham chiếu để có thể đóng khi shutdown. */
const server = app.listen(env.PORT, () => {
  console.log(
    `[server] Đang chạy ở chế độ ${env.NODE_ENV} tại http://localhost:${env.PORT}`
  );
  console.log(`[server] Health check: http://localhost:${env.PORT}/api/health`);
});

/**
 * Cờ chống việc chạy quy trình shutdown nhiều lần.
 * Ví dụ khi người dùng nhấn Ctrl+C liên tiếp, chỉ lần đầu tiên được xử lý.
 */
let isShuttingDown = false;

/**
 * @function gracefulShutdown
 * @description Tắt server theo trình tự an toàn, tránh mất dữ liệu hoặc rò rỉ kết nối.
 *
 * Trình tự:
 *  1. Ngừng nhận kết nối mới nhưng vẫn chờ các request đang xử lý hoàn tất.
 *  2. Đóng connection pool của Prisma/PostgreSQL.
 *  3. Thoát tiến trình.
 *
 * Ngoài ra đặt một timeout an toàn: nếu sau 10 giây vẫn còn kết nối treo,
 * tiến trình sẽ bị buộc thoát để không kẹt vô hạn trong lúc deploy.
 *
 * @param {string} signal - Tên tín hiệu đã kích hoạt shutdown (SIGINT, SIGTERM, ...).
 * @returns {void}
 */
const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[server] Nhận tín hiệu ${signal}, đang tắt server...`);

  // Buộc thoát nếu quá trình đóng kết nối kéo dài bất thường.
  const forceExitTimer = setTimeout(() => {
    console.error('[server] Không thể tắt trong 10s, buộc thoát tiến trình.');
    process.exit(1);
  }, 10_000);

  // `unref()` để timer này không giữ event loop sống nếu shutdown hoàn tất sớm.
  forceExitTimer.unref();

  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('[server] Đã đóng kết nối cơ sở dữ liệu. Tạm biệt!');
      process.exit(0);
    } catch (error) {
      console.error('[server] Lỗi khi đóng kết nối cơ sở dữ liệu:', error);
      process.exit(1);
    }
  });
};

// Ctrl+C ở terminal.
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Tín hiệu dừng từ Docker / process manager / nền tảng hosting.
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

/**
 * Bắt các Promise bị reject mà không có `.catch()`.
 * Ghi log rồi shutdown, vì trạng thái ứng dụng lúc này không còn đáng tin cậy.
 */
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled Promise Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

/**
 * Bắt exception đồng bộ không được try/catch.
 * Đây là lỗi nghiêm trọng nhất — luôn thoát tiến trình sau khi ghi log.
 */
process.on('uncaughtException', (error) => {
  console.error('[server] Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

export default server;
