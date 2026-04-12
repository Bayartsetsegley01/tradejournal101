import express from 'express';
import { getSummary, getCharts, getMistakes, getPerformance, getWeeklyReview, getMonthlyReview } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/summary', getSummary);
router.get('/charts', getCharts);
router.get('/mistakes', getMistakes);
router.get('/performance', getPerformance);
router.get('/weekly-review', getWeeklyReview);
router.get('/monthly-review', getMonthlyReview);

export default router;
