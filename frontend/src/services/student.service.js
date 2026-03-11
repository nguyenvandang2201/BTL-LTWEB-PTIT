import axiosInstance from '../utils/axiosInstance';

export const enrollCourse = async (course_id) =>
  axiosInstance.post('/student/enroll', { course_id });

export const getLessonVideo = async (lessonId) =>
  axiosInstance.get(`/student/lessons/${lessonId}/video`);

export const createReview = async (data) =>
  axiosInstance.post('/student/reviews', data);

export const getMyCourses = async () =>
  axiosInstance.get('/student/my-courses');

export const updateProfile = async (data) =>
  axiosInstance.put('/student/profile', data);

export const changePassword = async (data) =>
  axiosInstance.put('/student/change-password', data);
