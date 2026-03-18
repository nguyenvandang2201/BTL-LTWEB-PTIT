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
// Uses admin course-detail endpoint — returns full course including all lesson video_urls
export const getAdminLessons = async (courseId) =>
  axiosInstance.get(`/admin/courses/${courseId}`);

export const createLesson = async (data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  return axiosInstance.post('/admin/lessons', data, isFormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined);
};

export const updateLesson = async (id, data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  return axiosInstance.put(`/admin/lessons/${id}`, data, isFormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined);
};

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
