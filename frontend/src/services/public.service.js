import axiosInstance from '../utils/axiosInstance';

export const getCategories = async () => axiosInstance.get('/categories');

// getCourses hỗ trợ truyền params để backend xử lý tìm kiếm/lọc.
// Ví dụ: { q: 'react', category_id: 2 }
export const getCourses = async (params = {}) => axiosInstance.get('/courses', { params });

export const getCourseDetail = async (id) => axiosInstance.get(`/courses/${id}`);
