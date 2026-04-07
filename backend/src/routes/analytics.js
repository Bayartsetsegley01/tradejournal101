import express from 'express';
import { getSummary, getCharts, getMistakes } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/summary', getSummary);
router.get('/charts', getCharts);
router.get('/mistakes', getMistakes);

export default router;
