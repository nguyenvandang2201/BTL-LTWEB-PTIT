/**
 * @file adminRoutes.js
 * @description Định nghĩa các route API dành riêng cho Quản trị viên (Admin).
 *
 * Tất cả route trong file này đều yêu cầu:
 *  1. verifyToken : Xác thực JWT — đảm bảo người dùng đã đăng nhập.
 *  2. isAdmin     : Kiểm tra vai trò 'admin' — đảm bảo chỉ admin mới được truy cập.
 *
 * Nhóm chức năng:
 *  - Danh mục (Categories) : Tạo, cập nhật, xóa danh mục khóa học.
 *  - Khóa học (Courses)    : Xem chi tiết, tạo (kèm ảnh), cập nhật (kèm ảnh), xóa khóa học.
 *  - Bài học (Lessons)     : Tạo (kèm video), cập nhật (kèm video), xóa bài học.
 *  - Học viên (Students)   : Xem danh sách và chi tiết học viên.
 *  - Dashboard             : Thống kê top khóa học được mua nhiều nhất.
 *  - Đánh giá (Reviews)    : Xóa đánh giá không phù hợp.
 *
 * Upload file:
 *  - uploadCourseImage.single('image') : Multer middleware xử lý upload ảnh khóa học lên Cloudinary.
 *  - uploadLessonVideo.single('video') : Multer middleware xử lý upload video bài học lên Cloudinary.
 *
 * Prefix đăng ký trong app.js: /api/admin
 */

import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { categorySchema, courseSchema, lessonSchema, updateCategorySchema, updateCourseSchema, updateLessonSchema } from '../schemas/admin.schema.js';
import { createCategory, createCourse, createLesson, updateCategory, deleteCategory, getCourseAdmin, updateCourse, deleteCourse, updateLesson, deleteLesson, getStudents, getStudentDetail, deleteReview, getTopPurchasedCourses, triggerCourseIndex, getCourseIndexStatusHandler } from '../controllers/adminController.js';
import { uploadCourseImage, uploadLessonVideo } from '../config/cloudinary.js';

const router = Router();

// ---------------------------------------------------------------------------
// DANH MỤC KHÓA HỌC (Categories)
// ---------------------------------------------------------------------------

/**
 * @route  POST /api/admin/categories
 * @desc   Tạo một danh mục khóa học mới.
 * @access Private (Admin)
 * @middleware verifyToken → isAdmin → validate(categorySchema) → createCategory
 */
router.post('/categories', verifyToken, isAdmin, validate(categorySchema), createCategory);

/**
 * @route  PUT /api/admin/categories/:id
 * @desc   Cập nhật thông tin danh mục theo ID.
 * @access Private (Admin)
 * @middleware verifyToken → isAdmin → validate(updateCategorySchema) → updateCategory
 */
router.put('/categories/:id', verifyToken, isAdmin, validate(updateCategorySchema), updateCategory);

/**
 * @route  DELETE /api/admin/categories/:id
 * @desc   Xóa danh mục theo ID.
 * @access Private (Admin)
 * @middleware verifyToken → isAdmin → deleteCategory
 */
router.delete('/categories/:id', verifyToken, isAdmin, deleteCategory);

// ---------------------------------------------------------------------------
// KHÓA HỌC (Courses)
// ---------------------------------------------------------------------------

/**
 * @route  GET /api/admin/courses/:id
 * @desc   Lấy chi tiết khóa học theo ID (dành cho admin, không giới hạn nội dung).
 * @access Private (Admin)
 * @middleware verifyToken → isAdmin → getCourseAdmin
 */
router.get('/courses/:id', verifyToken, isAdmin, getCourseAdmin);

/**
 * @route  POST /api/admin/courses
 * @desc   Tạo khóa học mới kèm upload ảnh đại diện lên Cloudinary.
 *         File ảnh gửi dưới field name 'image' (multipart/form-data).
 * @access Private (Admin)
 * @middleware verifyToken → isAdmin → uploadCourseImage.single('image') → validate(courseSchema) → createCourse
 */
router.post('/courses', verifyToken, isAdmin, uploadCourseImage.single('image'), validate(courseSchema), createCourse);

/**
 * @route  PUT /api/admin/courses/:id
 * @desc   Cập nhật khóa học theo ID, cho phép thay ảnh đại diện mới nếu có.
 *         File ảnh (nếu có) gửi dưới field name 'image' (multipart/form-data).
 * @access Private (Admin)
 * @middleware verifyToken → isAdmin → uploadCourseImage.single('image') → validate(updateCourseSchema) → updateCourse
 */
router.put('/courses/:id', verifyToken, isAdmin, uploadCourseImage.single('image'), validate(updateCourseSchema), updateCourse);

/**
 * @route  DELETE /api/admin/courses/:id
 * @desc   Xóa khóa học theo ID.
 * @access Private (Admin)
 * @middleware verifyToken → isAdmin → deleteCourse
 */
router.delete('/courses/:id', verifyToken, isAdmin, deleteCourse);

/**
 * @route  POST /api/admin/courses/:id/index
 * @desc   Index noi dung khoa hoc cho DRA/RAG chatbot.
 * @access Private (Admin)
 */
router.post('/courses/:id/index', verifyToken, isAdmin, triggerCourseIndex);

/**
 * @route  GET /api/admin/courses/:id/index-status
 * @desc   Kiem tra so chunks da index cua khoa hoc.
 * @access Private (Admin)
 */
router.get('/courses/:id/index-status', verifyToken, isAdmin, getCourseIndexStatusHandler);

// ---------------------------------------------------------------------------
// BÀI HỌC (Lessons)
// ---------------------------------------------------------------------------

/**
 * @route  POST /api/admin/lessons
 * @desc   Tạo bài học mới kèm upload video lên Cloudinary.
 *         File video gửi dưới field name 'video' (multipart/form-data).
 * @access Private (Admin)
 * @middleware verifyToken → isAdmin → uploadLessonVideo.single('video') → validate(lessonSchema) → createLesson
 */
router.post('/lessons', verifyToken, isAdmin, uploadLessonVideo.single('video'), validate(lessonSchema), createLesson);

/**
 * @route  PUT /api/admin/lessons/:id
 * @desc   Cập nhật bài học theo ID, cho phép thay video mới nếu có.
 *         File video (nếu có) gửi dưới field name 'video' (multipart/form-data).
 * @access Private (Admin)
 * @middleware verifyToken → isAdmin → uploadLessonVideo.single('video') → validate(updateLessonSchema) → updateLesson
 */
router.put('/lessons/:id', verifyToken, isAdmin, uploadLessonVideo.single('video'), validate(updateLessonSchema), updateLesson);

/**
 * @route  DELETE /api/admin/lessons/:id
 * @desc   Xóa bài học theo ID.
 * @access Private (Admin)
 * @middleware verifyToken → isAdmin → deleteLesson
 */
router.delete('/lessons/:id', verifyToken, isAdmin, deleteLesson);

// ---------------------------------------------------------------------------
// HỌC VIÊN (Students)
// ---------------------------------------------------------------------------

/**
 * @route  GET /api/admin/students
 * @desc   Lấy danh sách tất cả học viên trong hệ thống.
 * @access Private (Admin)
 * @middleware verifyToken → isAdmin → getStudents
 */
router.get('/students', verifyToken, isAdmin, getStudents);

/**
 * @route  GET /api/admin/students/:id
 * @desc   Lấy thông tin chi tiết một học viên theo ID, bao gồm lịch sử đăng ký khóa học.
 * @access Private (Admin)
 * @middleware verifyToken → isAdmin → getStudentDetail
 */
router.get('/students/:id', verifyToken, isAdmin, getStudentDetail);

// ---------------------------------------------------------------------------
// DASHBOARD / THỐNG KÊ
// ---------------------------------------------------------------------------

// Khai báo endpoint dành cho dashboard admin.
// Endpoint này dùng để lấy danh sách top khóa học được mua nhiều nhất.
/**
 * @route  GET /api/admin/dashboard/top-purchased-courses
 * @desc   Lấy top 10 khóa học có số lượt mua nhiều nhất để hiển thị trên dashboard admin.
 * @access Private (Admin)
 * @middleware verifyToken → isAdmin → getTopPurchasedCourses
 */
router.get('/dashboard/top-purchased-courses', verifyToken, isAdmin, getTopPurchasedCourses);

// ---------------------------------------------------------------------------
// ĐÁNH GIÁ (Reviews)
// ---------------------------------------------------------------------------

/**
 * @route  DELETE /api/admin/reviews/:id
 * @desc   Xóa đánh giá không phù hợp theo ID (kiểm duyệt nội dung).
 * @access Private (Admin)
 * @middleware verifyToken → isAdmin → deleteReview
 */
router.delete('/reviews/:id', verifyToken, isAdmin, deleteReview);

export default router;
