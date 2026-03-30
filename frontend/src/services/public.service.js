// Service gọi các API công khai (không yêu cầu đăng nhập).
// Tất cả request đi qua axiosInstance.

import axiosInstance from '../utils/axiosInstance';

// Lấy danh sách tất cả danh mục khóa học.
export const getCategories = async () => axiosInstance.get('/categories');

// getCourses hỗ trợ truyền params để backend xử lý tìm kiếm/lọc.
// Ví dụ: { q: 'react', category_id: 2 }
export const getCourses = async (params = {}) => axiosInstance.get('/courses', { params });

// Lấy chi tiết một khóa học theo ID, kèm danh sách bài học và đánh giá.
export const getCourseDetail = async (id) => axiosInstance.get(`/courses/${id}`);
