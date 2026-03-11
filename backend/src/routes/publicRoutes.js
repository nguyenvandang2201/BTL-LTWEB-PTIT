import { Router } from 'express';
import { getCategories, getCourses, getCourseDetail } from '../controllers/publicController.js';

const router = Router();

router.get('/categories', getCategories);
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseDetail);

export default router;
