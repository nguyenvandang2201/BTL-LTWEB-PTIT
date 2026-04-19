/**
 * @file chat.schema.js
 * @description Zod schema xác thực dữ liệu đầu vào cho API AI Chatbot.
 *
 * Schema được truyền vào middleware `validate()` trong studentRoutes.js
 * để kiểm tra req.body trước khi request đến chatController.
 *
 * Ràng buộc:
 *  - lesson_id  {number, bắt buộc} : ID bài học đang xem, phải là số nguyên dương.
 *  - messages   {array, bắt buộc}  : Lịch sử hội thoại, 1–20 phần tử.
 *    - role     {string}            : 'user' hoặc 'assistant'.
 *    - content  {string}            : Nội dung tin nhắn, không được để trống.
 *
 * Dùng tại route: POST /api/student/chat
 *
 * Phụ thuộc:
 *  - zod : Thư viện schema validation TypeScript-first.
 */

import { z } from 'zod';

/**
 * @constant chatSchema
 * @description Schema Zod xác thực body khi học viên gửi câu hỏi tới AI Chatbot.
 */
export const chatSchema = z.object({
  lesson_id: z
    .number()
    .int('lesson_id phải là số nguyên')
    .positive('lesson_id phải là số nguyên dương'),

  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant'], {
          errorMap: () => ({ message: "role phải là 'user' hoặc 'assistant'" }),
        }),
        content: z.string().min(1, 'Nội dung tin nhắn không được để trống'),
      })
    )
    .min(1, 'Phải có ít nhất 1 tin nhắn')
    .max(20, 'Tối đa 20 tin nhắn trong một phiên'),
});