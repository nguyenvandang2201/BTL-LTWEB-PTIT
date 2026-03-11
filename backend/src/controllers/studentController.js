import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';

export const enrollCourse = async (req, res) => {
  try {
    const { course_id } = req.body;
    const user_id = req.user.userId;

    const existing = await prisma.enrollment.findFirst({
      where: { user_id, course_id },
    });
    if (existing) {
      return res.status(400).json({ message: 'Bạn đã sở hữu khóa này rồi' });
    }

    await prisma.enrollment.create({
      data: { user_id, course_id, is_paid: true },
    });

    return res.status(201).json({ message: 'Mua thành công! Vào học ngay' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const getLessonVideo = async (req, res) => {
  try {
    const { id: lesson_id } = req.params;
    const user_id = req.user.userId;

    const lesson = await prisma.lesson.findUnique({
      where: { lesson_id: parseInt(lesson_id) },
    });
    if (!lesson) {
      return res.status(404).json({ message: 'Không tìm thấy bài học' });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { user_id, course_id: lesson.course_id },
    });
    if (!enrollment || !enrollment.is_paid) {
      return res.status(403).json({ message: 'Vui lòng mua khóa học để xem' });
    }

    return res.status(200).json(lesson);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const createReview = async (req, res) => {
  try {
    const { course_id, rating, comment } = req.body;
    const user_id = req.user.userId;

    const enrollment = await prisma.enrollment.findFirst({
      where: { user_id, course_id },
    });
    if (!enrollment || !enrollment.is_paid) {
      return res.status(403).json({ message: 'Bạn phải học mới được đánh giá' });
    }

    await prisma.review.create({
      data: { user_id, course_id, rating, comment },
    });

    return res.status(201).json({ message: 'Cảm ơn đánh giá của bạn' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { full_name } = req.body;
    const user_id = req.user.userId;

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

export const changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const user_id = req.user.userId;

    const user = await prisma.user.findUnique({ where: { user_id } });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu cũ không chính xác' });
    }

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

export const getMyCourses = async (req, res) => {
  try {
    const user_id = req.user.userId;

    const enrollments = await prisma.enrollment.findMany({
      where: { user_id },
      include: { course: true },
    });

    return res.status(200).json(enrollments);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};
