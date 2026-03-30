/**
 * @file publicRoutes.js
 * @description Định nghĩa các route API công khai (Public) — không yêu cầu xác thực.
 *
 * Tất cả route trong file này có thể được truy cập bởi bất kỳ client nào
 * mà không cần JWT token, phục vụ mục đích hiển thị nội dung cho khách vãng lai.
 *
 * Danh sách route:
 *  - GET /categories            : Lấy danh sách toàn bộ danh mục khóa học.
 *  - GET /courses               : Lấy danh sách khóa học (hỗ trợ tìm kiếm và lọc theo danh mục).
 *  - GET /courses/top-purchased : Lấy top 10 khóa học được mua nhiều nhất.
 *  - GET /courses/:id           : Lấy chi tiết một khóa học (2 bài học đầu mở, còn lại khóa).
 *
 * Lưu ý thứ tự route quan trọng:
 *  - Route /courses/top-purchased phải được khai báo TRƯỚC /courses/:id.
 *    Nếu đảo ngược, Express sẽ hiểu "top-purchased" là một :id và gọi getCourseDetail thay vì getTopPurchasedCourses.
 *
 * Prefix đăng ký trong app.js: /api/public
 */

import { Router } from 'express';
import { getCategories, getCourses, getCourseDetail, getTopPurchasedCourses } from '../controllers/publicController.js';

const router = Router();

/**
 * @route  GET /api/public/categories
 * @desc   Lấy toàn bộ danh sách danh mục khóa học để hiển thị bộ lọc trên giao diện.
 * @access Public
 * @returns {200} Mảng Category[].
 */
router.get('/categories', getCategories);

/**
 * @route  GET /api/public/courses?q=<keyword>&category_id=<id>
 * @desc   Lấy danh sách khóa học, hỗ trợ:
 *          - Tìm kiếm fuzzy theo tiêu đề (q): dùng unaccent + pg_trgm nếu DB có extension,
 *            fallback về ILIKE nếu không có.
 *          - Lọc theo danh mục (category_id).
 *          - Kết quả kèm total_buyers, sắp xếp giảm dần theo số người mua.
 * @access Public
 * @query  q          {string} - Từ khóa tìm kiếm (tùy chọn).
 * @query  category_id {number} - ID danh mục để lọc (tùy chọn).
 * @returns {200} Mảng Course[] kèm category và total_buyers.
 */
router.get('/courses', getCourses);

/**
 * @route  GET /api/public/courses/top-purchased
 * @desc   Lấy top 10 khóa học có số lượt mua nhiều nhất (chỉ tính đơn is_paid = true).
 *         Dùng raw SQL để thống kê chính xác.
 *         Phải khai báo TRƯỚC /courses/:id để tránh bị Express hiểu 'top-purchased' là :id.
 * @access Public
 * @returns {200} Mảng { course_id, title, total_purchases }[] (tối đa 10 phần tử).
 */
router.get('/courses/top-purchased', getTopPurchasedCourses);

/**
 * @route  GET /api/public/courses/:id
 * @desc   Lấy chi tiết một khóa học theo ID, bao gồm:
 *          - Thông tin khóa học và danh mục.
 *          - Danh sách bài học (2 bài đầu is_locked = false kèm video_url;
 *            các bài sau is_locked = true, ẩn video_url).
 *          - Danh sách đánh giá kèm tên người đánh giá.
 * @access Public
 * @param  id {number} - course_id của khóa học cần xem.
 * @returns {200} Chi tiết Course kèm lessons và reviews.
 * @returns {404} Không tìm thấy khóa học.
 */
router.get('/courses/:id', getCourseDetail);

export default router;
