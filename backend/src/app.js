/**
 * @file app.js
 * @description Khởi tạo và cấu hình instance Express của ứng dụng.
 *
 * File này **chỉ** chịu trách nhiệm dựng app (middleware + routes + error handler)
 * và export ra ngoài, cố tình KHÔNG gọi `app.listen()`. Việc tách bạch này cho phép:
 *  - `src/index.js` đảm nhiệm vòng đời server (listen, graceful shutdown).
 *  - Test tích hợp import trực tiếp `app` và gọi qua supertest mà không cần mở cổng thật.
 *
 * Thứ tự middleware được sắp xếp có chủ đích:
 *   bảo mật → CORS → nén → log → parse body → rate limit → routes → xử lý lỗi
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

// Side effect: đặt tiếng Việt làm ngôn ngữ mặc định cho thông báo lỗi Zod.
import './config/zod.js';

import { env, corsOrigins, isProduction } from './config/env.js';
import { apiLimiter } from './middlewares/rateLimitMiddleware.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import publicRoutes from './routes/publicRoutes.js';

const app = express();

/* -------------------------------------------------------------------------- */
/* 1. Bảo mật & hạ tầng                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Tin tưởng header `X-Forwarded-*` do reverse proxy (Nginx, Render, Railway…) đặt.
 * Cần thiết để `req.ip` trả về IP thật của client — rate limit mới hoạt động đúng.
 */
app.set('trust proxy', 1);

/** Ẩn header `X-Powered-By: Express` để giảm thông tin lộ ra về stack công nghệ. */
app.disable('x-powered-by');

/**
 * Helmet đặt một loạt HTTP header bảo mật (HSTS, X-Content-Type-Options, …).
 *
 * `crossOriginResourcePolicy: 'cross-origin'` được nới lỏng vì frontend chạy ở
 * origin khác (Vite dev server) và cần tải được tài nguyên media từ Cloudinary.
 */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

/**
 * CORS chỉ cho phép các origin khai báo trong biến môi trường `CORS_ORIGIN`.
 *
 * Trường hợp `*`: cho phép mọi origin (chỉ nên dùng khi phát triển local).
 * Request không có header `Origin` (Postman, curl, health check) luôn được chấp nhận.
 */
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin không được phép bởi CORS: ${origin}`));
    },
    credentials: true,
  })
);

/** Nén response bằng gzip/brotli để giảm băng thông và thời gian tải. */
app.use(compression());

/**
 * Ghi log HTTP request.
 * - Production: định dạng `combined` (chuẩn Apache, đầy đủ thông tin để phân tích).
 * - Development: định dạng `dev` (ngắn gọn, tô màu theo status code).
 */
app.use(morgan(isProduction ? 'combined' : 'dev'));

/* -------------------------------------------------------------------------- */
/* 2. Parse request body                                                       */
/* -------------------------------------------------------------------------- */

/** Parse JSON body, giới hạn 1MB để hạn chế payload lớn gây cạn kiệt bộ nhớ. */
app.use(express.json({ limit: '1mb' }));

/** Parse dữ liệu form `application/x-www-form-urlencoded`. */
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

/* -------------------------------------------------------------------------- */
/* 3. Health check                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Endpoint kiểm tra tình trạng dịch vụ, dùng cho load balancer / uptime monitor.
 * Đặt TRƯỚC rate limit để việc giám sát không bị chặn khi lưu lượng tăng cao.
 *
 * @route  GET /api/health
 * @access Public
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* -------------------------------------------------------------------------- */
/* 4. Rate limiting & API routes                                               */
/* -------------------------------------------------------------------------- */

/** Giới hạn số request trên mỗi IP cho toàn bộ nhánh `/api`. */
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api', publicRoutes);

/* -------------------------------------------------------------------------- */
/* 5. Xử lý lỗi (bắt buộc đăng ký sau cùng)                                    */
/* -------------------------------------------------------------------------- */

app.use(notFound);
app.use(errorHandler);

export default app;
