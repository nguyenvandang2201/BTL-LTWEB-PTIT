/**
 * @file env.js
 * @description Đọc, xác thực và chuẩn hoá toàn bộ biến môi trường của ứng dụng.
 *
 * Mục tiêu của module này là áp dụng nguyên tắc "fail fast": nếu thiếu hoặc sai
 * một biến môi trường bắt buộc, ứng dụng sẽ dừng ngay khi khởi động kèm thông
 * báo rõ ràng, thay vì chạy được một lúc rồi lỗi khó hiểu ở giữa runtime
 * (ví dụ: `jwt.sign()` ném lỗi vì JWT_SECRET là undefined).
 *
 * Mọi nơi khác trong codebase nên import `env` từ file này thay vì đọc trực
 * tiếp `process.env`, để đảm bảo giá trị đã được validate và ép kiểu đúng.
 *
 * Phụ thuộc:
 *  - dotenv : Nạp file `.env` vào `process.env`.
 *  - zod    : Định nghĩa schema và xác thực giá trị biến môi trường.
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Nạp file .env vào process.env trước khi đọc bất kỳ biến nào.
dotenv.config();

/**
 * Schema mô tả toàn bộ biến môi trường mà ứng dụng sử dụng.
 *
 * Quy ước:
 *  - Biến bắt buộc  : khai báo `.min(1)` hoặc ràng buộc tương đương, không có `.default()`.
 *  - Biến tuỳ chọn  : luôn có `.default()` để code phía sau không phải xử lý `undefined`.
 *  - Biến dạng số   : dùng `z.coerce.number()` vì `process.env` luôn trả về chuỗi.
 */
const envSchema = z.object({
  /** Môi trường chạy ứng dụng, ảnh hưởng tới log, stack trace và cache Prisma. */
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  /** Cổng HTTP mà server Express lắng nghe. */
  PORT: z.coerce.number().int().positive().default(5000),

  /** Chuỗi kết nối PostgreSQL dạng `postgresql://user:pass@host:port/db`. */
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL là bắt buộc (chuỗi kết nối PostgreSQL)'),

  /**
   * Khoá bí mật dùng để ký JWT.
   * Yêu cầu tối thiểu 32 ký tự nhằm chống tấn công brute-force chữ ký token.
   */
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET phải dài tối thiểu 32 ký tự để đảm bảo an toàn'),

  /** Thời hạn hiệu lực của access token (định dạng của thư viện `jsonwebtoken`). */
  JWT_EXPIRES_IN: z.string().default('1d'),

  /**
   * Danh sách origin được phép gọi API, phân tách bằng dấu phẩy.
   * Ví dụ: `http://localhost:5173,https://myapp.vercel.app`.
   */
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  /** Cửa sổ thời gian (phút) áp dụng cho rate limit. */
  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),

  /** Số request tối đa cho phép trên mỗi IP trong một cửa sổ rate limit. */
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

  /** Tên cloud của tài khoản Cloudinary (tuỳ chọn nếu không dùng upload thật). */
  CLOUDINARY_CLOUD_NAME: z.string().optional(),

  /** API Key Cloudinary. */
  CLOUDINARY_API_KEY: z.string().optional(),

  /** API Secret Cloudinary. */
  CLOUDINARY_API_SECRET: z.string().optional(),
});

/**
 * Kết quả xác thực biến môi trường theo `envSchema`.
 * Dùng `safeParse` để tự kiểm soát thông báo lỗi thay vì để zod ném exception thô.
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Gom tất cả lỗi thành danh sách dễ đọc: "TÊN_BIẾN: mô tả lỗi".
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  console.error(
    '\n[CONFIG ERROR] Cấu hình biến môi trường không hợp lệ:\n' +
      `${details}\n\n` +
      'Hãy sao chép file `.env.example` thành `.env` và điền đầy đủ giá trị.\n'
  );

  // Thoát với mã lỗi khác 0 để process manager (pm2, Docker, CI) biết là khởi động thất bại.
  process.exit(1);
}

/**
 * Đối tượng cấu hình đã được xác thực và ép kiểu, dùng chung cho toàn ứng dụng.
 * @type {z.infer<typeof envSchema>}
 */
export const env = parsed.data;

/**
 * Danh sách origin được phép gọi API, đã tách từ chuỗi `CORS_ORIGIN`.
 * Giá trị `*` được giữ nguyên để cho phép mọi origin (chỉ nên dùng khi dev).
 *
 * @type {string[]}
 */
export const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/** Cờ tiện ích: ứng dụng có đang chạy ở môi trường production hay không. */
export const isProduction = env.NODE_ENV === 'production';

/** Cờ tiện ích: ứng dụng có đang chạy ở môi trường development hay không. */
export const isDevelopment = env.NODE_ENV === 'development';

export default env;
