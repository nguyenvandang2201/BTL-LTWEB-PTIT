/**
 * @file prisma.js
 * @description Khởi tạo và export một instance PrismaClient duy nhất dùng chung
 * cho toàn bộ ứng dụng, kết hợp với connection pool của PostgreSQL (pg) thông
 * qua driver adapter `@prisma/adapter-pg`.
 */

import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env, isProduction } from './env.js';

/**
 * Tạo một instance PrismaClient mới với driver adapter PostgreSQL.
 *
 * Quy trình:
 *  1. Tạo connection pool (`pg.Pool`) từ chuỗi kết nối DATABASE_URL trong .env.
 *     Connection pool giúp tái sử dụng các TCP connection thay vì mở mới mỗi
 *     lần có query, cải thiện hiệu năng đáng kể khi có nhiều request đồng thời.
 *  2. Bọc pool đó trong `PrismaPg` — adapter giúp Prisma giao tiếp với PostgreSQL
 *     thông qua thư viện `pg` thay vì driver mặc định.
 *  3. Khởi tạo `PrismaClient` với adapter trên và trả về instance.
 *
 * @returns {PrismaClient} Instance PrismaClient đã được cấu hình và sẵn sàng dùng.
 */
const createPrismaClient = () => {
  /** Connection pool tới PostgreSQL, lấy URL từ biến môi trường DATABASE_URL. */
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

  /** Adapter chuyển đổi giao thức giữa Prisma và thư viện pg. */
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
};

/**
 * Instance PrismaClient duy nhất được dùng trong toàn bộ ứng dụng (Singleton).
 *
 * Cơ chế:
 *  - Nếu `globalThis.prisma` đã tồn tại (từ lần hot-reload trước), dùng lại
 *    instance đó thay vì tạo mới → tránh vượt quá giới hạn connection pool.
 *  - Nếu chưa có, gọi `createPrismaClient()` để tạo instance lần đầu.
 *
 * Lý do dùng `globalThis`: Trong môi trường phát triển, các bundler / runtime
 * như Node.js có thể re-import module nhiều lần (hot-reload). Nếu không lưu
 * vào `globalThis`, mỗi lần reload sẽ tạo thêm một instance mới, nhanh chóng
 * cạn kiệt connection pool của cơ sở dữ liệu.
 */
const prisma = globalThis.prisma ?? createPrismaClient();

/**
 * Trong môi trường phát triển (non-production), lưu instance vào `globalThis`
 * để các lần hot-reload tiếp theo có thể tái sử dụng thay vì tạo mới.
 *
 * Không áp dụng ở production vì server production không hot-reload —
 * module chỉ được import một lần duy nhất trong suốt vòng đời tiến trình.
 */
if (!isProduction) {
  globalThis.prisma = prisma;
}

/** Export instance singleton để toàn bộ ứng dụng import và sử dụng. */
export default prisma;
