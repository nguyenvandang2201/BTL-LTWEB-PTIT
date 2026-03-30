/**
 * @file publicController.js
 * @description Controller xử lý các API công khai (không yêu cầu xác thực).
 *
 * Bao gồm các chức năng:
 *  - getCategories         : Lấy danh sách tất cả danh mục khóa học.
 *  - getTopPurchasedCourses: Lấy top 10 khóa học được mua nhiều nhất (raw SQL).
 *  - getCourses            : Lấy danh sách khóa học, hỗ trợ fuzzy search (unaccent + pg_trgm)
 *                            và lọc theo danh mục; fallback về LIKE nếu extension chưa cài.
 *  - getCourseDetail       : Lấy chi tiết một khóa học, kèm bài học và đánh giá;
 *                            2 bài học đầu mở khóa miễn phí, các bài còn lại bị khóa.
 *
 * Phụ thuộc:
 *  - Prisma ORM (@prisma/client) để truy vấn CSDL PostgreSQL.
 *  - Extension PostgreSQL: unaccent, pg_trgm (tùy chọn, dùng cho fuzzy search).
 */

import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';

// Cờ đánh dấu đã thử khởi tạo extension fuzzy hay chưa.
// Dùng module-level variable để tránh gọi lại CREATE EXTENSION nhiều lần trong cùng tiến trình.
let fuzzyExtensionsInitialized = false;

// Thử bật extension cần cho fuzzy search (PostgreSQL).
// Nếu môi trường DB không cho phép CREATE EXTENSION, hệ thống vẫn chạy bằng fallback query.
const ensureFuzzyExtensions = async () => {
  if (fuzzyExtensionsInitialized) return;
  fuzzyExtensionsInitialized = true;

  try {
    // 'unaccent' giúp chuẩn hoá ký tự có dấu thành không dấu khi so sánh.
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS unaccent;');
    // 'pg_trgm' cung cấp hàm similarity() và toán tử % cho tìm kiếm mờ (fuzzy).
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
  } catch (error) {
    console.warn('[courses-search] Không thể tự bật unaccent/pg_trgm:', error.message);
  }
};

// Hàm gắn total_buyers vào danh sách khóa học.
// Thực hiện một truy vấn groupBy enrollments riêng rồi join vào memory để tránh N+1 query.
const attachTotalBuyers = async (courses) => {
  if (!courses.length) return courses;

  // Lấy danh sách course_id hiện có để lọc trong query enrollments.
  const courseIds = courses.map((course) => course.course_id);

  // Đếm số lượt đăng ký đã thanh toán (is_paid = true) theo từng khóa học.
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

  // Tạo Map để tra cứu O(1): course_id → số người mua.
  const buyersMap = new Map(
    buyersByCourse.map((item) => [item.course_id, item._count.user_id])
  );

  // Gắn field total_buyers vào từng course; mặc định 0 nếu chưa có ai mua.
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

/**
 * @function getCategories
 * @description Lấy toàn bộ danh sách danh mục khóa học.
 *
 * @route  GET /api/public/categories
 * @access Public
 *
 * @param {import('express').Request}  req - Request (không cần tham số).
 * @param {import('express').Response} res - Response JSON mảng Category[].
 *
 * @returns {200} Danh sách tất cả danh mục.
 * @returns {500} Lỗi máy chủ.
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// API lấy top 10 khóa học được mua nhiều nhất theo đúng SQL user cung cấp.
/**
 * @function getTopPurchasedCourses
 * @description Lấy top 10 khóa học có số lượt mua nhiều nhất (chỉ tính đơn đã thanh toán).
 *
 * Dùng raw SQL để thống kê chính xác theo yêu cầu nghiệp vụ:
 *  - JOIN enrollments với is_paid = true.
 *  - GROUP BY course_id, đếm enrollment_id.
 *  - ORDER BY total_purchases DESC, lấy LIMIT 10.
 *
 * @route  GET /api/public/courses/top-purchased
 * @access Public
 *
 * @param {import('express').Request}  req - Request (không cần tham số).
 * @param {import('express').Response} res - Response JSON mảng { course_id, title, total_purchases }[].
 *
 * @returns {200} Danh sách top 10 khóa học bán chạy.
 * @returns {500} Lỗi máy chủ.
 */
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

/**
 * @function getCourses
 * @description Lấy danh sách khóa học, hỗ trợ tìm kiếm fuzzy và lọc theo danh mục.
 *
 * Chiến lược xử lý:
 *  1. Nếu không có filter (không có q, không có category_id):
 *     → Dùng Prisma ORM bình thường, sắp xếp theo ngày tạo mới nhất.
 *  2. Nếu có từ khóa (q):
 *     → Thử bật extension unaccent + pg_trgm.
 *     → Dùng raw SQL với similarity() và toán tử % để tìm kiếm mờ không phân biệt dấu.
 *     → Nếu extension chưa có → fallback dùng Prisma contains (ILIKE).
 *  3. Kết quả cuối cùng luôn được gắn total_buyers và sắp xếp giảm dần theo số người mua.
 *
 * @route  GET /api/public/courses?q=<keyword>&category_id=<id>
 * @access Public
 *
 * @param {import('express').Request}  req - Request, query params: q (string), category_id (number).
 * @param {import('express').Response} res - Response JSON mảng Course[] kèm category và total_buyers.
 *
 * @returns {200} Danh sách khóa học phù hợp (có thể rỗng).
 * @returns {500} Lỗi máy chủ.
 */
export const getCourses = async (req, res) => {
  try {
    // Nhận query params để hỗ trợ tìm kiếm gần đúng trên backend.
    const q = String(req.query.q ?? '').trim();
    const categoryId = req.query.category_id ? Number(req.query.category_id) : null;

    // Kiểm tra xem người dùng có truyền keyword hay không.
    const hasKeyword = q.length > 0;
    // Kiểm tra category_id hợp lệ (số nguyên dương).
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
      // Mảng điều kiện WHERE động, sẽ được nối bằng AND.
      const whereConditions = [];

      // Thêm điều kiện lọc theo danh mục nếu có category_id hợp lệ.
      if (hasCategoryFilter) {
        whereConditions.push(Prisma.sql`c.category_id = ${categoryId}`);
      }

      // Thêm điều kiện fuzzy search trên title:
      //   - Toán tử % (pg_trgm): kiểm tra độ tương đồng trigram >= ngưỡng mặc định (thường 0.3).
      //   - similarity() >= 0.2: ngưỡng thủ công để bắt thêm kết quả gần đúng.
      //   - LIKE '%...%': đảm bảo bắt cả chuỗi con khớp chính xác.
      //   - unaccent + lower: chuẩn hoá dấu và chữ hoa/thường để so sánh không phân biệt.
      if (hasKeyword) {
        whereConditions.push(Prisma.sql`
          (
            unaccent(lower(c.title)) % unaccent(lower(${q}))
            OR similarity(unaccent(lower(c.title)), unaccent(lower(${q}))) >= 0.2
            OR unaccent(lower(c.title)) LIKE '%' || unaccent(lower(${q})) || '%'
          )
        `);
      }

      // Kết hợp các điều kiện thành mệnh đề WHERE hoàn chỉnh, hoặc rỗng nếu không có điều kiện.
      const whereSql = whereConditions.length
        ? Prisma.sql`WHERE ${Prisma.join(whereConditions, Prisma.sql` AND `)}`
        : Prisma.empty;

      // Thực hiện raw query lấy thông tin khóa học kèm tên danh mục và điểm similarity.
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

      // Chuyển đổi row phẳng từ raw query sang cấu trúc object có nested category.
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
      // Nhận diện bằng error code 42883 (undefined_function trong PostgreSQL)
      // hoặc message chứa tên hàm/toán tử bị thiếu.
      const isFuzzyFeatureError =
        error?.code === '42883' ||
        String(error?.message || '').toLowerCase().includes('unaccent') ||
        String(error?.message || '').toLowerCase().includes('similarity') ||
        String(error?.message || '').includes('%');

      // Nếu lỗi không liên quan đến fuzzy feature thì ném lại để xử lý ở catch ngoài.
      if (!isFuzzyFeatureError) {
        throw error;
      }

      // Fallback: dùng Prisma ORM với contains (ILIKE) thay cho fuzzy SQL.
      const fallbackCourses = await prisma.course.findMany({
        where: {
          ...(hasCategoryFilter ? { category_id: categoryId } : {}),
          ...(hasKeyword
            ? {
              title: {
                contains: q,
                mode: 'insensitive', // Tìm kiếm không phân biệt hoa/thường.
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

/**
 * @function getCourseDetail
 * @description Lấy chi tiết một khóa học theo ID, bao gồm danh sách bài học và đánh giá.
 *
 * Logic mở khóa bài học:
 *  - 2 bài học đầu tiên (index 0, 1 tính theo order_index ASC): is_locked = false, trả đầy đủ video_url.
 *  - Các bài còn lại: is_locked = true, loại bỏ video_url khỏi response để bảo vệ nội dung trả phí.
 *
 * @route  GET /api/public/courses/:id
 * @access Public
 *
 * @param {import('express').Request}  req - Request, params: id (course_id dạng số nguyên).
 * @param {import('express').Response} res - Response JSON Course kèm lessons (có is_locked) và reviews.
 *
 * @returns {200} Chi tiết khóa học.
 * @returns {404} Không tìm thấy khóa học với ID đã cho.
 * @returns {500} Lỗi máy chủ.
 */
export const getCourseDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Truy vấn khóa học kèm danh mục, bài học (sắp xếp theo order_index) và đánh giá.
    const course = await prisma.course.findUnique({
      where: { course_id: parseInt(id) },
      include: {
        category: { select: { name: true } },
        lessons: {
          select: {
            lesson_id: true,
            title: true,
            order_index: true,
            video_url: true, // Sẽ bị loại bỏ cho các bài bị khoá ở bước xử lý sau.
          },
          orderBy: { order_index: 'asc' },
        },
        reviews: {
          include: {
            user: { select: { full_name: true } }, // Chỉ lấy tên người đánh giá, không lộ thông tin nhạy cảm.
          },
        },
      },
    });

    // Trả 404 nếu không tìm thấy khóa học với ID đã cung cấp.
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }

    // Xây dựng lại danh sách lessons với trạng thái khoá:
    //  - index < 2: bài học miễn phí xem trước, is_locked = false, giữ nguyên video_url.
    //  - index >= 2: bài học trả phí, is_locked = true, loại video_url khỏi response.
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
