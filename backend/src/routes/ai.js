import express from 'express';
import { getInsights } from '../controllers/aiController.js';

const router = express.Router();

router.post('/insights', getInsights);

export default router;
