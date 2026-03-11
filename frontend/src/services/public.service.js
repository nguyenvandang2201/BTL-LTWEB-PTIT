import axiosInstance from '../utils/axiosInstance';

export const getCategories = async () => axiosInstance.get('/categories');

export const getCourses = async () => axiosInstance.get('/courses');

export const getCourseDetail = async (id) => axiosInstance.get(`/courses/${id}`);
