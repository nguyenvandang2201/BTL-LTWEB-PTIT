import axiosInstance from '../utils/axiosInstance';

// ── Categories ────────────────────────────────────────────────
export const getCategories = async () =>
  axiosInstance.get('/admin/categories');

export const createCategory = async (data) =>
  axiosInstance.post('/admin/categories', data);

export const updateCategory = async (id, data) =>
  axiosInstance.put(`/admin/categories/${id}`, data);

export const deleteCategory = async (id) =>
  axiosInstance.delete(`/admin/categories/${id}`);

// ── Courses ───────────────────────────────────────────────────
export const getAdminCourses = async () =>
  axiosInstance.get('/admin/courses');

export const createCourse = async (data) =>
  axiosInstance.post('/admin/courses', data);

export const updateCourse = async (id, data) =>
  axiosInstance.put(`/admin/courses/${id}`, data);

export const deleteCourse = async (id) =>
  axiosInstance.delete(`/admin/courses/${id}`);

// ── Lessons ───────────────────────────────────────────────────
export const getAdminLessons = async (courseId) =>
  axiosInstance.get(`/admin/lessons?course_id=${courseId}`);

export const createLesson = async (data) =>
  axiosInstance.post('/admin/lessons', data);

export const updateLesson = async (id, data) =>
  axiosInstance.put(`/admin/lessons/${id}`, data);

export const deleteLesson = async (id) =>
  axiosInstance.delete(`/admin/lessons/${id}`);

// ── Students ──────────────────────────────────────────────────
export const getStudents = async () =>
  axiosInstance.get('/admin/students');

export const getStudentDetail = async (id) =>
  axiosInstance.get(`/admin/students/${id}`);

// ── Reviews ───────────────────────────────────────────────────
export const deleteReview = async (id) =>
  axiosInstance.delete(`/admin/reviews/${id}`);
