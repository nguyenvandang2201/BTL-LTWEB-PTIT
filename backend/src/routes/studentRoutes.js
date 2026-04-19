/**
 * @file studentRoutes.js
 * @description Định nghĩa các route API dành riêng cho Học viên (Student).
 *
 * Tất cả route trong file này đều yêu cầu:
 *  1. verifyToken : Xác thực JWT — đảm bảo người dùng đã đăng nhập.
 *
 * Lưu ý: File này không dùng isStudent middleware (phân quyền theo role),
 * thay vào đó controller tự kiểm tra nghiệp vụ (ví dụ: kiểm tra enrollment is_paid).
 * Điều này cho phép admin cũng có thể gọi một số endpoint nếu cần.
 *
 * Danh sách route:
 *  - POST /enroll              : Mua / đăng ký khóa học.
 *  - GET  /lessons/:id/video   : Lấy nội dung bài học (có kiểm tra quyền truy cập).
 *  - POST /reviews             : Gửi đánh giá cho khóa học đã mua.
 *  - GET  /my-courses          : Lấy danh sách khóa học cá nhân.
 *  - PUT  /profile             : Cập nhật hồ sơ cá nhân (họ tên).
 *  - PUT  /change-password     : Đổi mật khẩu sau khi xác minh mật khẩu cũ.
 *  - POST /chat                : Gửi câu hỏi tới AI Chatbot theo ngữ cảnh bài giảng.
 *
 * Prefix đăng ký trong app.js: /api/student
 */

import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { enrollSchema, reviewSchema, updateProfileSchema, changePasswordSchema } from '../schemas/student.schema.js';
import { chatSchema } from '../schemas/chat.schema.js';
import { enrollCourse, getLessonVideo, createReview, getMyCourses, updateProfile, changePassword } from '../controllers/studentController.js';
import { askChatbot } from '../controllers/chatController.js';

const router = Router();

/**
 * @route  POST /api/student/enroll
 * @desc   Đăng ký (mua) một khóa học. Ghi nhận enrollment với is_paid = true.
 *         Trả lỗi 400 nếu học viên đã sở hữu khóa học này.
 *         enrollSchema kiểm tra: course_id (number, bắt buộc).
 * @access Private (JWT required)
 * @middleware verifyToken → validate(enrollSchema) → enrollCourse
 * @body    { course_id: number }
 * @returns {201} Mua thành công.
 * @returns {400} Đã sở hữu khóa học hoặc dữ liệu không hợp lệ.
 */
router.post('/enroll', verifyToken, validate(enrollSchema), enrollCourse);

/**
 * @route  GET /api/student/lessons/:id/video
 * @desc   Lấy nội dung đầy đủ của bài học (kể cả video_url).
 *         - 2 bài đầu tiên của mỗi khóa học: miễn phí, không cần enrollment.
 *         - Các bài còn lại: yêu cầu enrollment với is_paid = true.
 *         Không có validate vì không có body, chỉ cần lesson_id từ params.
 * @access Private (JWT required)
 * @middleware verifyToken → getLessonVideo
 * @param  id {number} - lesson_id của bài học cần xem.
 * @returns {200} Dữ liệu đầy đủ của bài học kèm video_url.
 * @returns {403} Chưa mua khóa học.
 * @returns {404} Không tìm thấy bài học.
 */
router.get('/lessons/:id/video', verifyToken, getLessonVideo);

/**
 * @route  POST /api/student/reviews
 * @desc   Gửi đánh giá (rating + comment) cho khóa học đã mua.
 *         Yêu cầu enrollment is_paid = true; trả 403 nếu chưa mua.
 *         reviewSchema kiểm tra: course_id (number), rating (1–5), comment (string).
 * @access Private (JWT required)
 * @middleware verifyToken → validate(reviewSchema) → createReview
 * @body    { course_id: number, rating: number, comment: string }
 * @returns {201} Đánh giá được ghi nhận.
 * @returns {403} Chưa mua khóa học.
 * @returns {400} Dữ liệu không hợp lệ.
 */
router.post('/reviews', verifyToken, validate(reviewSchema), createReview);

/**
 * @route  GET /api/student/my-courses
 * @desc   Lấy danh sách tất cả khóa học mà người dùng hiện tại đã đăng ký,
 *         kèm thông tin chi tiết của từng khóa học (include course).
 *         Không phân biệt trạng thái is_paid.
 * @access Private (JWT required)
 * @middleware verifyToken → getMyCourses
 * @returns {200} Mảng Enrollment[] kèm course.
 */
router.get('/my-courses', verifyToken, getMyCourses);

/**
 * @route  PUT /api/student/profile
 * @desc   Cập nhật thông tin hồ sơ cá nhân. Hiện chỉ hỗ trợ cập nhật full_name.
 *         Trả về thông tin user đã cập nhật (không bao gồm password).
 *         updateProfileSchema kiểm tra: full_name (string, không rỗng).
 * @access Private (JWT required)
 * @middleware verifyToken → validate(updateProfileSchema) → updateProfile
 * @body    { full_name: string }
 * @returns {200} Cập nhật thành công, trả về { message, user }.
 * @returns {400} Dữ liệu không hợp lệ.
 */
router.put('/profile', verifyToken, validate(updateProfileSchema), updateProfile);

/**
 * @route  PUT /api/student/change-password
 * @desc   Đổi mật khẩu sau khi xác minh mật khẩu cũ bằng bcrypt.compare.
 *         Trả 400 nếu mật khẩu cũ không khớp; mật khẩu mới được băm trước khi lưu.
 *         changePasswordSchema kiểm tra: old_password (string), new_password (độ dài tối thiểu).
 * @access Private (JWT required)
 * @middleware verifyToken → validate(changePasswordSchema) → changePassword
 * @body    { old_password: string, new_password: string }
 * @returns {200} Đổi mật khẩu thành công.
 * @returns {400} Mật khẩu cũ không chính xác hoặc dữ liệu không hợp lệ.
 * @returns {404} Không tìm thấy người dùng.
 */
router.put('/change-password', verifyToken, validate(changePasswordSchema), changePassword);

/**
 * @route  POST /api/student/chat
 * @desc   Gửi câu hỏi tới AI Chatbot trong ngữ cảnh bài học đang xem.
 *         Controller query DB lấy thông tin bài học, xây dựng system prompt
 *         nhúng context và gọi Google Gemini API để sinh câu trả lời.
 *         chatSchema kiểm tra: lesson_id (number), messages (array 1–20 phần tử).
 * @access Private (JWT required)
 * @middleware verifyToken → validate(chatSchema) → askChatbot
 * @body    { lesson_id: number, messages: [{role: 'user'|'assistant', content: string}] }
 * @returns {200} { reply: string } — Câu trả lời từ Gemini AI.
 * @returns {404} Không tìm thấy bài học.
 * @returns {500} Lỗi kết nối Gemini API.
 */
router.post('/chat', verifyToken, validate(chatSchema), askChatbot);

export default router;
