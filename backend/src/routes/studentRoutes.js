import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { enrollSchema, reviewSchema, updateProfileSchema, changePasswordSchema } from '../schemas/student.schema.js';
import { enrollCourse, getLessonVideo, createReview, getMyCourses, updateProfile, changePassword } from '../controllers/studentController.js';

const router = Router();

router.post('/enroll', verifyToken, validate(enrollSchema), enrollCourse);
router.get('/lessons/:id/video', verifyToken, getLessonVideo);
router.post('/reviews', verifyToken, validate(reviewSchema), createReview);
router.get('/my-courses', verifyToken, getMyCourses);
router.put('/profile', verifyToken, validate(updateProfileSchema), updateProfile);
router.put('/change-password', verifyToken, validate(changePasswordSchema), changePassword);

export default router;
