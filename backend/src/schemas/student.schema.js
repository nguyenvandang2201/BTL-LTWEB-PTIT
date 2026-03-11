import { z } from 'zod';

export const enrollSchema = z.object({
  course_id: z.number().int().positive('course_id phải là số nguyên dương'),
});

export const reviewSchema = z.object({
  course_id: z.number().int().positive('course_id phải là số nguyên dương'),
  rating: z.number().int().min(1, 'Rating tối thiểu là 1').max(5, 'Rating tối đa là 5'),
  comment: z.string().min(1, 'Bình luận không được để trống'),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Họ tên không được để trống'),
});

export const changePasswordSchema = z.object({
  old_password: z.string().min(6, 'Mật khẩu cũ phải có ít nhất 6 ký tự'),
  new_password: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});
