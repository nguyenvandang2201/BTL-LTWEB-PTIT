import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống'),
  description: z.string().optional(),
});

export const courseSchema = z.object({
  title: z.string().min(1, 'Tiêu đề khóa học không được để trống'),
  price: z.coerce.number().min(0, 'Giá không được âm'),
  category_id: z.coerce.number().int('category_id phải là số nguyên'),
  description: z.string().optional(),
  image_url: z.string().optional(),
});

export const lessonSchema = z.object({
  course_id: z.coerce.number().int('course_id phải là số nguyên'),
  title: z.string().min(1, 'Tiêu đề bài giảng không được để trống'),
  video_url: z.string().url('video_url phải là URL hợp lệ').optional(),
  order_index: z.coerce.number().int('order_index phải là số nguyên'),
});

export const updateCategorySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

export const updateCourseSchema = z.object({
  title: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  category_id: z.coerce.number().int().optional(),
  description: z.string().optional(),
  image_url: z.string().optional(),
});

export const updateLessonSchema = z.object({
  title: z.string().optional(),
  video_url: z.string().url().optional(),
  order_index: z.coerce.number().int().optional(),
});
