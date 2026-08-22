import { z } from 'zod';

export const indexCourseSchema = z.object({
  id: z.coerce.number().int().positive('ID khoa hoc phai la so nguyen duong'),
});
