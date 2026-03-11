import prisma from '../config/prisma.js';

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existing = await prisma.category.findFirst({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
    }

    await prisma.category.create({ data: { name, description } });

    return res.status(201).json({ message: 'Thêm danh mục thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const createCourse = async (req, res) => {
  try {
    const { title, price, description, category_id, image_url } = req.body;

    const course = await prisma.course.create({
      data: { title, price, description, category_id, image_url },
    });

    return res.status(201).json({ message: 'Tạo khóa học thành công', course_id: course.course_id });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const createLesson = async (req, res) => {
  try {
    const { course_id, title, video_url, order_index } = req.body;

    const lesson = await prisma.lesson.create({
      data: { course_id, title, video_url, order_index },
    });

    return res.status(201).json({ message: 'Thêm bài giảng thành công', lesson });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.category.update({ where: { category_id: id }, data: req.body });
    return res.status(200).json({ message: 'Cập nhật danh mục thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const category = await prisma.category.findUnique({
      where: { category_id: id },
      include: { courses: true },
    });
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    if (category.courses.length > 0) {
      return res.status(400).json({ message: 'Không thể xóa danh mục đang chứa khóa học. Vui lòng xóa khóa học trước' });
    }
    await prisma.category.delete({ where: { category_id: id } });
    return res.status(200).json({ message: 'Xóa danh mục thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.course.update({ where: { course_id: id }, data: req.body });
    return res.status(200).json({ message: 'Cập nhật khóa học thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.course.delete({ where: { course_id: id } });
    return res.status(200).json({ message: 'Xóa khóa học thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const updateLesson = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.lesson.update({ where: { lesson_id: id }, data: req.body });
    return res.status(200).json({ message: 'Cập nhật bài giảng thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const deleteLesson = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.lesson.delete({ where: { lesson_id: id } });
    return res.status(200).json({ message: 'Xóa bài giảng thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const getStudents = async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      select: { user_id: true, full_name: true, email: true, created_at: true },
    });
    return res.status(200).json(students);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const getStudentDetail = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const student = await prisma.user.findFirst({
      where: { user_id: id, role: 'student' },
      select: {
        user_id: true,
        full_name: true,
        email: true,
        role: true,
        created_at: true,
        enrollments: {
          include: { course: true },
        },
      },
    });
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học viên' });
    }
    return res.status(200).json(student);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.review.delete({ where: { review_id: id } });
    return res.status(200).json({ message: 'Đã xóa bình luận/đánh giá' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};
