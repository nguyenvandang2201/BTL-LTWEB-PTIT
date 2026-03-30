// Service gọi các API dành cho học viên (yêu cầu đăng nhập).
// Token được tự động đính kèm bởi axiosInstance request interceptor.

import axiosInstance from '../utils/axiosInstance';

// Mua / đăng ký khóa học theo course_id.
export const enrollCourse = async (course_id) =>
  axiosInstance.post('/student/enroll', { course_id });

// Lấy nội dung bài học (kể cả video_url) theo lessonId.
// Kiểm tra quyền truy cập được thực hiện ở backend.
export const getLessonVideo = async (lessonId) =>
  axiosInstance.get(`/student/lessons/${lessonId}/video`);

// Gửi đánh giá (rating + comment) cho khóa học đã mua.
export const createReview = async (data) =>
  axiosInstance.post('/student/reviews', data);

// Lấy danh sách khóa học mà người dùng đã đăng ký.
export const getMyCourses = async () =>
  axiosInstance.get('/student/my-courses');

// Cập nhật thông tin hồ sơ cá nhân (họ tên).
export const updateProfile = async (data) =>
  axiosInstance.put('/student/profile', data);

// Đổi mật khẩu — cần truyền { old_password, new_password }.
export const changePassword = async (data) =>
  axiosInstance.put('/student/change-password', data);
