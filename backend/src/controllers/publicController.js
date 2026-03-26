import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';

// Cờ đánh dấu đã thử khởi tạo extension fuzzy hay chưa.
let fuzzyExtensionsInitialized = false;

// Thử bật extension cần cho fuzzy search (PostgreSQL).
// Nếu môi trường DB không cho phép CREATE EXTENSION, hệ thống vẫn chạy bằng fallback query.
const ensureFuzzyExtensions = async () => {
  if (fuzzyExtensionsInitialized) return;
  fuzzyExtensionsInitialized = true;

  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS unaccent;');
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
  } catch (error) {
    console.warn('[courses-search] Không thể tự bật unaccent/pg_trgm:', error.message);
  }
};

// Hàm gắn total_buyers vào danh sách khóa học.
const attachTotalBuyers = async (courses) => {
  if (!courses.length) return courses;

  const courseIds = courses.map((course) => course.course_id);

  const buyersByCourse = await prisma.enrollment.groupBy({
    by: ['course_id'],
    where: {
      is_paid: true,
      course_id: { in: courseIds },
    },
    _count: {
      user_id: true,
    },
  });

  const buyersMap = new Map(
    buyersByCourse.map((item) => [item.course_id, item._count.user_id])
  );

  return courses.map((course) => ({
    ...course,
    total_buyers: buyersMap.get(course.course_id) || 0,
  }));
};

// Hàm sắp xếp giảm dần theo số người học (total_buyers).
// Dùng spread tạo mảng mới.
const sortCoursesByBuyersDesc = (courses) => (
  [...courses].sort((a, b) => (b.total_buyers ?? 0) - (a.total_buyers ?? 0))
);

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// API lấy top 10 khóa học được mua nhiều nhất theo đúng SQL user cung cấp.
export const getTopPurchasedCourses = async (req, res) => {
  try {
    // Dùng raw query để giữ đúng cú pháp/logic thống kê theo yêu cầu.
    const topPurchasedCourses = await prisma.$queryRaw`
      SELECT
          c.course_id,
          c.title,
          COUNT(e.enrollment_id)::int AS total_purchases
      FROM
          courses c
      JOIN
          enrollments e ON c.course_id = e.course_id
      WHERE
          e.is_paid = true
      GROUP BY
          c.course_id,
          c.title
      ORDER BY
          total_purchases DESC
      LIMIT 10;
    `;

    // Trả dữ liệu top 10 cho client.
    return res.status(200).json(topPurchasedCourses);
  } catch (error) {
    // Trả lỗi 500 nếu query thất bại.
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const getCourses = async (req, res) => {
  try {
    // Nhận query params để hỗ trợ tìm kiếm gần đúng trên backend.
    const q = String(req.query.q ?? '').trim();
    const categoryId = req.query.category_id ? Number(req.query.category_id) : null;

    const hasKeyword = q.length > 0;
    const hasCategoryFilter = Number.isInteger(categoryId) && categoryId > 0;

    // Trường hợp không truyền filter: giữ nguyên hành vi cũ để tương thích toàn hệ thống.
    if (!hasKeyword && !hasCategoryFilter) {
      const courses = await prisma.course.findMany({
        include: {
          category: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
      });

      // Gắn tổng số người học đã thanh toán vào từng khóa học.
      const coursesWithBuyers = await attachTotalBuyers(courses);

      // Sắp xếp giảm dần theo total_buyers trước khi trả về cho frontend.
      const sortedCourses = sortCoursesByBuyersDesc(coursesWithBuyers);
      return res.status(200).json(sortedCourses);
    }

    // Nếu có từ khóa, thử chuẩn bị extension để bật fuzzy query tốt hơn.
    if (hasKeyword) {
      await ensureFuzzyExtensions();
    }

    // Dùng fuzzy query trên title + lọc category (nếu có).
    try {
      const whereConditions = [];

      if (hasCategoryFilter) {
        whereConditions.push(Prisma.sql`c.category_id = ${categoryId}`);
      }

      if (hasKeyword) {
        whereConditions.push(Prisma.sql`
          (
            unaccent(lower(c.title)) % unaccent(lower(${q}))
            OR similarity(unaccent(lower(c.title)), unaccent(lower(${q}))) >= 0.2
            OR unaccent(lower(c.title)) LIKE '%' || unaccent(lower(${q})) || '%'
          )
        `);
      }

      const whereSql = whereConditions.length
        ? Prisma.sql`WHERE ${Prisma.join(whereConditions, Prisma.sql` AND `)}`
        : Prisma.empty;

      const rows = await prisma.$queryRaw(Prisma.sql`
        SELECT
          c.course_id,
          c.category_id,
          c.title,
          c.description,
          c.price,
          c.image_url,
          c.created_at,
          cat.name AS category_name,
          ${hasKeyword
    ? Prisma.sql`similarity(unaccent(lower(c.title)), unaccent(lower(${q})))`
    : Prisma.sql`0`} AS similarity_score
        FROM courses c
        LEFT JOIN categories cat ON cat.category_id = c.category_id
        ${whereSql}
        ORDER BY
          ${hasKeyword ? Prisma.sql`similarity_score DESC,` : Prisma.empty}
          c.created_at DESC
      `);

      const fuzzyCourses = rows.map((row) => {
        const { category_name: categoryName, ...course } = row;
        return {
          ...course,
          category: { name: categoryName },
        };
      });

      // Gắn total_buyers cho danh sách kết quả fuzzy.
      const coursesWithBuyers = await attachTotalBuyers(fuzzyCourses);

      // Sắp xếp giảm dần theo total_buyers trước khi trả về.
      const sortedCourses = sortCoursesByBuyersDesc(coursesWithBuyers);
      return res.status(200).json(sortedCourses);
    } catch (error) {
      // Fallback khi DB chưa có unaccent/pg_trgm hoặc không hỗ trợ hàm fuzzy.
      const isFuzzyFeatureError =
        error?.code === '42883' ||
        String(error?.message || '').toLowerCase().includes('unaccent') ||
        String(error?.message || '').toLowerCase().includes('similarity') ||
        String(error?.message || '').includes('%');

      if (!isFuzzyFeatureError) {
        throw error;
      }

      const fallbackCourses = await prisma.course.findMany({
        where: {
          ...(hasCategoryFilter ? { category_id: categoryId } : {}),
          ...(hasKeyword
            ? {
              title: {
                contains: q,
                mode: 'insensitive',
              },
            }
            : {}),
        },
        include: {
          category: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
      });

      // Gắn total_buyers cho danh sách fallback.
      const coursesWithBuyers = await attachTotalBuyers(fallbackCourses);

      // Sắp xếp giảm dần theo total_buyers trước khi trả về.
      const sortedCourses = sortCoursesByBuyersDesc(coursesWithBuyers);
      return res.status(200).json(sortedCourses);
    }
  } catch (error) {
    // Trả lỗi server nếu có exception trong quá trình truy vấn/xử lý.
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
