import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { categorySchema, courseSchema, lessonSchema, updateCategorySchema, updateCourseSchema, updateLessonSchema } from '../schemas/admin.schema.js';
import { createCategory, createCourse, createLesson, updateCategory, deleteCategory, updateCourse, deleteCourse, updateLesson, deleteLesson, getStudents, getStudentDetail, deleteReview } from '../controllers/adminController.js';
import uploadCloud from '../config/cloudinary.js';

const router = Router();

router.post('/categories', verifyToken, isAdmin, validate(categorySchema), createCategory);
router.put('/categories/:id', verifyToken, isAdmin, validate(updateCategorySchema), updateCategory);
router.delete('/categories/:id', verifyToken, isAdmin, deleteCategory);

router.post('/courses', verifyToken, isAdmin, uploadCloud.single('image'), validate(courseSchema), createCourse);
router.put('/courses/:id', verifyToken, isAdmin, uploadCloud.single('image'), validate(updateCourseSchema), updateCourse);
router.delete('/courses/:id', verifyToken, isAdmin, deleteCourse);

router.post('/lessons', verifyToken, isAdmin, validate(lessonSchema), createLesson);
router.put('/lessons/:id', verifyToken, isAdmin, validate(updateLessonSchema), updateLesson);
router.delete('/lessons/:id', verifyToken, isAdmin, deleteLesson);

router.get('/students', verifyToken, isAdmin, getStudents);
router.get('/students/:id', verifyToken, isAdmin, getStudentDetail);

router.delete('/reviews/:id', verifyToken, isAdmin, deleteReview);

export default router;
