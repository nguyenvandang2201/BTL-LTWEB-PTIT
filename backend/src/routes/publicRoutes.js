import { Router } from 'express';
import { getCategories, getCourses, getCourseDetail, getTopPurchasedCourses } from '../controllers/publicController.js';

const router = Router();

router.get('/categories', getCategories);
router.get('/courses', getCourses);
router.get('/courses/top-purchased', getTopPurchasedCourses);
router.get('/courses/:id', getCourseDetail);

export default router;
