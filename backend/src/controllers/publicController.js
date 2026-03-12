import prisma from '../config/prisma.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const getCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        category: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    return res.status(200).json(courses);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const getCourseDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { course_id: parseInt(id) },
      include: {
        category: { select: { name: true } },
        lessons: {
          select: {
            lesson_id: true,
            title: true,
            order_index: true,
            video_url: true,
          },
          orderBy: { order_index: 'asc' },
        },
        reviews: {
          include: {
            user: { select: { full_name: true } },
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }

    const courseWithLockedLessons = {
      ...course,
      lessons: course.lessons.map((lesson, index) => {
        if (index < 2) {
          return { ...lesson, is_locked: false };
        }
        const { video_url, ...rest } = lesson;
        return { ...rest, is_locked: true };
      }),
    };

    return res.status(200).json(courseWithLockedLessons);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};
