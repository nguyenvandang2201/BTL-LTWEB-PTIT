/**
 * @file studentController.js
 * @description Controller xử lý các chức năng dành riêng cho sinh viên (đã đăng nhập).
 *
 * Bao gồm các chức năng:
 *  - enrollCourse   : Mua / đăng ký khóa học (ghi nhận thanh toán).
 *  - getLessonVideo : Lấy nội dung bài học; 2 bài đầu miễn phí, còn lại yêu cầu đã mua.
 *  - createReview   : Gửi đánh giá (rating + comment) cho khóa học đã mua.
 *  - updateProfile  : Cập nhật họ tên của người dùng hiện tại.
 *  - changePassword : Đổi mật khẩu sau khi xác thực mật khẩu cũ.
 *  - getMyCourses   : Lấy danh sách khóa học mà người dùng đã đăng ký.
 *
 * Tất cả route yêu cầu middleware xác thực JWT; userId được lấy từ req.user.userId.
 *
 * Phụ thuộc:
 *  - bcrypt      : Băm và so sánh mật khẩu an toàn.
 *  - Prisma ORM  : Truy vấn CSDL PostgreSQL.
 */

import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';

/**
 * @function enrollCourse
 * @description Ghi nhận việc mua / đăng ký một khóa học cho sinh viên.
 *
 * Luồng xử lý:
 *  1. Lấy course_id từ body và user_id từ JWT payload (req.user.userId).
 *  2. Kiểm tra sinh viên đã đăng ký khóa học này chưa → trả 400 nếu trùng.
 *  3. Tạo bản ghi enrollment với is_paid = true (mặc định thanh toán thành công).
 *  4. Trả 201 khi ghi nhận thành công.
 *
 * @route  POST /api/student/enroll
 * @access Private (student)
 *
 * @param {import('express').Request}  req - Request chứa body { course_id } và req.user.userId.
 * @param {import('express').Response} res - Response JSON { message }.
 *
 * @returns {201} Mua thành công.
 * @returns {400} Sinh viên đã sở hữu khóa học này.
 * @returns {500} Lỗi máy chủ.
 */
export const enrollCourse = async (req, res) => {
  try {
    const { course_id } = req.body;
    // user_id được giải mã từ JWT token qua middleware xác thực.
    const user_id = req.user.userId;

    // Kiểm tra đã tồn tại enrollment chưa để tránh mua trùng.
    const existing = await prisma.enrollment.findFirst({
      where: { user_id, course_id },
    });
    if (existing) {
      return res.status(400).json({ message: 'Bạn đã sở hữu khóa này rồi' });
    }

    // Tạo bản ghi enrollment mới, đánh dấu is_paid = true (đã thanh toán).
    await prisma.enrollment.create({
      data: { user_id, course_id, is_paid: true },
    });

    return res.status(201).json({ message: 'Mua thành công! Vào học ngay' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * @function getLessonVideo
 * @description Trả về nội dung bài học (bao gồm video_url) nếu người dùng có quyền truy cập.
 *
 * Quy tắc phân quyền:
 *  - 2 bài học đầu tiên (theo order_index ASC) trong mỗi khóa học là bài học miễn phí xem trước.
 *  - Các bài còn lại yêu cầu enrollment với is_paid = true mới được xem.
 *
 * Luồng xử lý:
 *  1. Lấy lesson_id từ params, user_id từ JWT.
 *  2. Tìm bài học → 404 nếu không tồn tại.
 *  3. Lấy 2 bài đầu (order_index ASC) của cùng khóa học để xác định bài học miễn phí.
 *  4. Nếu không phải bài miễn phí → kiểm tra enrollment is_paid → 403 nếu chưa mua.
 *  5. Trả toàn bộ dữ liệu bài học (kể cả video_url) nếu đủ điều kiện.
 *
 * @route  GET /api/student/lessons/:id
 * @access Private (student)
 *
 * @param {import('express').Request}  req - Request, params: id (lesson_id), req.user.userId.
 * @param {import('express').Response} res - Response JSON Lesson đầy đủ.
 *
 * @returns {200} Dữ liệu bài học.
 * @returns {403} Chưa mua khóa học.
 * @returns {404} Không tìm thấy bài học.
 * @returns {500} Lỗi máy chủ.
 */
export const getLessonVideo = async (req, res) => {
  try {
    const { id: lesson_id } = req.params;
    const user_id = req.user.userId;

    // Tìm bài học theo lesson_id; chuyển sang số nguyên vì params luôn là chuỗi.
    const lesson = await prisma.lesson.findUnique({
      where: { lesson_id: parseInt(lesson_id) },
    });
    if (!lesson) {
      return res.status(404).json({ message: 'Không tìm thấy bài học' });
    }

    // Check if this lesson is among the first 2 in its course (free preview)
    // Lấy đúng 2 bài đầu theo order_index để so sánh với lesson hiện tại.
    const firstTwoLessons = await prisma.lesson.findMany({
      where: { course_id: lesson.course_id },
      orderBy: { order_index: 'asc' },
      take: 2,
      select: { lesson_id: true },
    });
    // Xác định bài học có nằm trong 2 bài miễn phí không.
    const isFreeLesson = firstTwoLessons.some((l) => l.lesson_id === lesson.lesson_id);

    // Nếu không phải bài miễn phí, kiểm tra trạng thái đăng ký / thanh toán.
    if (!isFreeLesson) {
      const enrollment = await prisma.enrollment.findFirst({
        where: { user_id, course_id: lesson.course_id },
      });
      // Từ chối nếu chưa có enrollment hoặc chưa thanh toán.
      if (!enrollment || !enrollment.is_paid) {
        return res.status(403).json({ message: 'Vui lòng mua khóa học để xem' });
      }
    }

    // Trả toàn bộ thông tin bài học (bao gồm video_url) cho client.
    return res.status(200).json(lesson);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * @function createReview
 * @description Tạo đánh giá (rating + comment) cho một khóa học.
 *
 * Điều kiện: Sinh viên phải có enrollment với is_paid = true mới được phép đánh giá.
 *
 * Luồng xử lý:
 *  1. Lấy course_id, rating, comment từ body; user_id từ JWT.
 *  2. Kiểm tra enrollment tồn tại và đã thanh toán → 403 nếu chưa đủ điều kiện.
 *  3. Tạo bản ghi review.
 *  4. Trả 201 khi tạo thành công.
 *
 * @route  POST /api/student/reviews
 * @access Private (student)
 *
 * @param {import('express').Request}  req - Request, body { course_id, rating, comment }, req.user.userId.
 * @param {import('express').Response} res - Response JSON { message }.
 *
 * @returns {201} Đánh giá được ghi nhận thành công.
 * @returns {403} Sinh viên chưa mua khóa học.
 * @returns {500} Lỗi máy chủ.
 */
export const createReview = async (req, res) => {
  try {
    const { course_id, rating, comment } = req.body;
    const user_id = req.user.userId;

    // Kiểm tra sinh viên đã mua khóa học chưa trước khi cho phép đánh giá.
    const enrollment = await prisma.enrollment.findFirst({
      where: { user_id, course_id },
    });
    if (!enrollment || !enrollment.is_paid) {
      return res.status(403).json({ message: 'Bạn phải học mới được đánh giá' });
    }

    // Tạo review mới liên kết user → course với rating và comment.
    await prisma.review.create({
      data: { user_id, course_id, rating, comment },
    });

    return res.status(201).json({ message: 'Cảm ơn đánh giá của bạn' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * @function updateProfile
 * @description Cập nhật thông tin hồ sơ cá nhân của người dùng đang đăng nhập.
 *
 * Hiện tại chỉ hỗ trợ cập nhật trường full_name.
 *
 * @route  PUT /api/student/profile
 * @access Private (student)
 *
 * @param {import('express').Request}  req - Request, body { full_name }, req.user.userId.
 * @param {import('express').Response} res - Response JSON { message, user }.
 *
 * @returns {200} Cập nhật thành công, trả về thông tin user đã cập nhật.
 * @returns {500} Lỗi máy chủ.
 */
export const updateProfile = async (req, res) => {
  try {
    const { full_name } = req.body;
    const user_id = req.user.userId;

    // Cập nhật full_name và trả về các trường an toàn (không trả password).
    const user = await prisma.user.update({
      where: { user_id },
      data: { full_name },
      select: { user_id: true, full_name: true, email: true, role: true, created_at: true },
    });

    return res.status(200).json({ message: 'Cập nhật thông tin thành công', user });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * @function changePassword
 * @description Đổi mật khẩu sau khi xác minh mật khẩu cũ.
 *
 * Luồng xử lý:
 *  1. Lấy old_password, new_password từ body; user_id từ JWT.
 *  2. Tìm user theo user_id → 404 nếu không tồn tại.
 *  3. So sánh old_password với hash trong CSDL bằng bcrypt → 400 nếu sai.
 *  4. Băm new_password với bcrypt salt rounds 10.
 *  5. Cập nhật password mới vào CSDL.
 *
 * @route  PUT /api/student/change-password
 * @access Private (student)
 *
 * @param {import('express').Request}  req - Request, body { old_password, new_password }, req.user.userId.
 * @param {import('express').Response} res - Response JSON { message }.
 *
 * @returns {200} Đổi mật khẩu thành công.
 * @returns {400} Mật khẩu cũ không chính xác.
 * @returns {404} Không tìm thấy người dùng.
 * @returns {500} Lỗi máy chủ.
 */
export const changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const user_id = req.user.userId;

    // Tìm user theo user_id để lấy hash mật khẩu hiện tại.
    const user = await prisma.user.findUnique({ where: { user_id } });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Xác minh mật khẩu cũ bằng bcrypt.compare.
    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu cũ không chính xác' });
    }

    // Băm mật khẩu mới trước khi lưu vào CSDL.
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await prisma.user.update({
      where: { user_id },
      data: { password: hashedPassword },
    });

    return res.status(200).json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * @function getMyCourses
 * @description Lấy danh sách khóa học mà người dùng hiện tại đã đăng ký.
 *
 * Trả về tất cả enrollment của user hiện tại kèm thông tin chi tiết của từng khóa học.
 * Không phân biệt trạng thái is_paid (bao gồm cả chưa thanh toán nếu có).
 *
 * @route  GET /api/student/my-courses
 * @access Private (student)
 *
 * @param {import('express').Request}  req - Request, req.user.userId.
 * @param {import('express').Response} res - Response JSON mảng Enrollment[] kèm course.
 *
 * @returns {200} Danh sách enrollment kèm thông tin khóa học.
 * @returns {500} Lỗi máy chủ.
 */
export const getMyCourses = async (req, res) => {
  try {
    const user_id = req.user.userId;

    // Lấy tất cả enrollment của user, kèm include thông tin khóa học liên quan.
    const enrollments = await prisma.enrollment.findMany({
      where: { user_id },
      include: { course: true },
    });

    return res.status(200).json(enrollments);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};
