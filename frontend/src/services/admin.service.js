// Service gọi các API dành cho quản trị viên (yêu cầu role='admin').
// Token admin được tự động đính kèm bởi axiosInstance request interceptor.

import axiosInstance from '../utils/axiosInstance';

// ── Categories ────────────────────────────────────────────────
// GET uses the public endpoint (no admin GET route exists)
// Lấy danh sách danh mục — dùng endpoint public vì không có endpoint GET riêng cho admin.
export const getCategories = async () =>
  axiosInstance.get('/categories');

// Tạo danh mục mới.
export const createCategory = async (data) =>
  axiosInstance.post('/admin/categories', data);

// Cập nhật danh mục theo ID.
export const updateCategory = async (id, data) =>
  axiosInstance.put(`/admin/categories/${id}`, data);

// Xóa danh mục theo ID.
export const deleteCategory = async (id) =>
  axiosInstance.delete(`/admin/categories/${id}`);

// ── Courses ───────────────────────────────────────────────────
// GET uses the public endpoint (no admin GET route exists)
// Lấy danh sách khóa học — dùng endpoint public.
export const getAdminCourses = async () =>
  axiosInstance.get('/courses');

// Tạo khóa học mới kèm ảnh đại diện (multipart/form-data).
export const createCourse = async (formData) =>
  axiosInstance.post('/admin/courses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Cập nhật khóa học theo ID, có thể kèm ảnh mới (multipart/form-data).
export const updateCourse = async (id, formData) =>
  axiosInstance.put(`/admin/courses/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Xóa khóa học theo ID.
export const deleteCourse = async (id) =>
  axiosInstance.delete(`/admin/courses/${id}`);

export const indexCourse = async (id) =>
  axiosInstance.post(`/admin/courses/${id}/index`);

export const getCourseIndexStatus = async (id) =>
  axiosInstance.get(`/admin/courses/${id}/index-status`);

// ── Lessons ───────────────────────────────────────────────────
// Uses admin course-detail endpoint — returns full course including all lesson video_urls
// Lấy danh sách bài học của một khóa học (dùng endpoint chi tiết khóa học của admin,
// trả về đầy đủ video_url cho tất cả bài — khác với endpoint public có giới hạn).
export const getAdminLessons = async (courseId) =>
  axiosInstance.get(`/admin/courses/${courseId}`);

// Tạo bài học mới. Tự động set Content-Type multipart/form-data nếu data là FormData.
export const createLesson = async (data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  return axiosInstance.post('/admin/lessons', data, isFormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined);
};

// Cập nhật bài học theo ID. Tự động set Content-Type multipart/form-data nếu data là FormData.
export const updateLesson = async (id, data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  return axiosInstance.put(`/admin/lessons/${id}`, data, isFormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined);
};

// Xóa bài học theo ID.
export const deleteLesson = async (id) =>
  axiosInstance.delete(`/admin/lessons/${id}`);

// ── Students ──────────────────────────────────────────────────
// Lấy danh sách học viên, hỗ trợ sắp xếp theo tham số sort (mặc định: newest).
export const getStudents = async (sort = 'newest') =>
  axiosInstance.get('/admin/students', { params: { sort } });

// Lấy thông tin chi tiết một học viên theo ID kèm lịch sử đăng ký.
export const getStudentDetail = async (id) =>
  axiosInstance.get(`/admin/students/${id}`);

// ── Dashboard ─────────────────────────────────────────────────
// Hàm service gọi API lấy top 10 khóa học được mua nhiều nhất.
export const getTopPurchasedCourses = async () =>
  // Gửi GET request tới endpoint dashboard admin ở backend.
  axiosInstance.get('/admin/dashboard/top-purchased-courses');

// ── Reviews ───────────────────────────────────────────────────
// Xóa đánh giá không phù hợp theo ID (kiểm duyệt nội dung).
export const deleteReview = async (id) =>
  axiosInstance.delete(`/admin/reviews/${id}`);
