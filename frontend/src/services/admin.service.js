import axiosInstance from '../utils/axiosInstance';

// ── Categories ────────────────────────────────────────────────
// GET uses the public endpoint (no admin GET route exists)
export const getCategories = async () =>
  axiosInstance.get('/categories');

export const createCategory = async (data) =>
  axiosInstance.post('/admin/categories', data);

export const updateCategory = async (id, data) =>
  axiosInstance.put(`/admin/categories/${id}`, data);

export const deleteCategory = async (id) =>
  axiosInstance.delete(`/admin/categories/${id}`);

// ── Courses ───────────────────────────────────────────────────
// GET uses the public endpoint (no admin GET route exists)
export const getAdminCourses = async () =>
  axiosInstance.get('/courses');

export const createCourse = async (formData) =>
  axiosInstance.post('/admin/courses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateCourse = async (id, formData) =>
  axiosInstance.put(`/admin/courses/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteCourse = async (id) =>
  axiosInstance.delete(`/admin/courses/${id}`);

// ── Lessons ───────────────────────────────────────────────────
// Uses public course-detail endpoint (no admin GET lessons route exists)
// Returns full course object; extract .lessons from the result
export const getAdminLessons = async (courseId) =>
  axiosInstance.get(`/courses/${courseId}`);

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
