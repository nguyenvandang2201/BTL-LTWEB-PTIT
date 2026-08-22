import OpenAI from 'openai';
import { env } from './env.js';

/** Tên mô hình DeepSeek dùng cho chat completion. */
export const DEEPSEEK_MODEL = env.DEEPSEEK_MODEL;

/**
 * Kiểm tra API key DeepSeek đã được cấu hình chưa.
 *
 * Được gọi ngay trước khi phát sinh request tới DeepSeek để báo lỗi rõ ràng,
 * thay vì để SDK ném ra lỗi 401 khó hiểu từ phía nhà cung cấp.
 *
 * @throws {Error} Nếu DEEPSEEK_API_KEY chưa được đặt trong `.env`.
 */
export function assertDeepSeekConfigured() {
  if (!env.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY chưa được cấu hình trong backend/.env');
  }
}

const deepseek = new OpenAI({
  // Giá trị giữ chỗ cho phép module khởi tạo được ngay cả khi chưa có key;
  // assertDeepSeekConfigured() ở trên mới là nơi chặn request thật.
  apiKey: env.DEEPSEEK_API_KEY || 'missing-deepseek-api-key',
  baseURL: 'https://api.deepseek.com/v1',
});

export default deepseek;
