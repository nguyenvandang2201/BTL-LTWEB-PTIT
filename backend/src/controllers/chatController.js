/**
 * @file chatController.js
 * @description Controller xử lý AI Chatbot — trả lời câu hỏi học viên
 *              theo ngữ cảnh bài giảng đang xem, sử dụng Google Gemini API.
 *
 * Luồng xử lý:
 *  1. Lấy lesson_id và messages từ req.body; user đã được xác thực bởi verifyToken.
 *  2. Query DB: lấy thông tin bài học kèm khóa học (include course) để xây dựng context.
 *  3. Tạo system prompt nhúng: tên bài học, tên khóa học, mô tả khóa học.
 *  4. Map lịch sử messages (trừ tin cuối) sang định dạng Gemini history.
 *  5. Khởi tạo Gemini model (gemini-1.5-flash) + bắt đầu phiên chat với history.
 *  6. Gửi câu hỏi mới nhất → nhận text reply từ Gemini.
 *  7. Trả về { reply } cho client.
 *
 * @route  POST /api/student/chat
 * @access Private (JWT required — verifyToken middleware)
 *
 * Phụ thuộc:
 *  - @google/generative-ai : SDK chính thức của Google Gemini.
 *  - Prisma ORM            : Query bài học + khóa học từ PostgreSQL.
 *  - GEMINI_API_KEY        : Biến môi trường chứa API key Gemini.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../config/prisma.js';

// Khởi tạo Gemini client một lần duy nhất khi module được load.
// Tránh tạo instance mới mỗi lần request để tiết kiệm tài nguyên.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * @function askChatbot
 * @description Xử lý câu hỏi từ học viên, gọi Gemini API với context bài giảng,
 *              trả về câu trả lời AI bằng tiếng Việt.
 *
 * @param {import('express').Request}  req - body: { lesson_id: number, messages: [{role, content}] }
 * @param {import('express').Response} res - JSON { reply: string }
 *
 * @returns {200} { reply } — Câu trả lời từ Gemini AI.
 * @returns {404} Không tìm thấy bài học với lesson_id đã cho.
 * @returns {500} Lỗi kết nối Gemini API hoặc lỗi máy chủ.
 */
export const askChatbot = async (req, res) => {
  try {
    const { lesson_id, messages } = req.body;

    // 1. Query bài học kèm thông tin khóa học để xây dựng system prompt.
    //    include: { course: true } lấy title và description của khóa học.
    const lesson = await prisma.lesson.findUnique({
      where: { lesson_id: parseInt(lesson_id) },
      include: { course: true },
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Không tìm thấy bài học' });
    }

    // 2. Xây dựng system prompt — nhúng toàn bộ context bài giảng.
    //    Gemini sẽ giới hạn câu trả lời trong phạm vi kiến thức bài học này.
    const systemPrompt = `Bạn là trợ lý AI thông minh hỗ trợ học viên trong nền tảng học trực tuyến.

Thông tin bài học hiện tại:
- Khóa học: "${lesson.course.title}"
- Bài học: "${lesson.title}"
- Mô tả khóa học: ${lesson.course.description || 'Không có mô tả chi tiết'}

Nhiệm vụ của bạn:
- Giải thích, làm rõ các khái niệm liên quan đến bài học và khóa học này bằng tiếng Việt.
- Trả lời ngắn gọn, dễ hiểu; dùng ví dụ minh họa khi cần thiết.
- Nếu học viên hỏi ngoài chủ đề bài học, hãy nhẹ nhàng hướng họ quay lại nội dung chính.
- Khuyến khích học viên đặt thêm câu hỏi và tiếp tục học.
- Không bịa đặt thông tin không liên quan đến chủ đề bài học.`;

    // 3. Tách tin nhắn cuối (câu hỏi mới nhất) ra khỏi lịch sử.
    //    Gemini nhận history là tất cả các tin TRƯỚC câu hỏi hiện tại.
    //    Lưu ý: role trong Gemini API là 'user' | 'model' (không phải 'assistant').
    //
    //    ⚠️ Quan trọng: Gemini yêu cầu history PHẢI bắt đầu bằng role 'user'.
    //    Frontend khởi tạo state với 1 tin nhắn chào role='assistant' — khi học viên
    //    gửi câu hỏi đầu tiên, tin chào này sẽ nằm đầu history với role='model'
    //    → Gemini báo lỗi "First content should be with role 'user'".
    //    Giải pháp: lọc bỏ tất cả tin 'model' đứng đầu history trước khi gửi Gemini.
    const rawHistory = messages.slice(0, -1).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    // Tìm vị trí tin nhắn 'user' đầu tiên và cắt từ đó để đảm bảo history hợp lệ.
    const firstUserIndex = rawHistory.findIndex((m) => m.role === 'user');
    const history = firstUserIndex > 0
      ? rawHistory.slice(firstUserIndex)  // Bỏ các tin 'model' đứng đầu
      : firstUserIndex === 0
        ? rawHistory                        // History đã hợp lệ, giữ nguyên
        : [];                               // Không có 'user' nào → history rỗng

    const lastMessage = messages[messages.length - 1].content;

    // 4. Khởi tạo model gemini-2.5-flash-lite — nhẹ, nhanh, hoạt động tốt trên free tier.
    //    systemInstruction được gửi một lần, áp dụng cho toàn bộ phiên chat.
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: systemPrompt,
    });

    // 5. Bắt đầu phiên chat với lịch sử hội thoại đã có.
    const chat = model.startChat({ history });

    // 6. Gửi câu hỏi mới nhất của học viên và nhận câu trả lời.
    const result = await chat.sendMessage(lastMessage);
    const reply = result.response.text();

    // 7. Trả về câu trả lời cho frontend.
    return res.status(200).json({ reply });
  } catch (error) {
    // Log lỗi chi tiết ở server để debug, nhưng không leak thông tin nhạy cảm ra client.
    console.error('[chatController] Lỗi khi gọi Gemini API:', error.message);
    return res.status(500).json({
      message: 'Không thể kết nối AI lúc này. Vui lòng thử lại sau.',
      error: error.message,
    });
  }
};
