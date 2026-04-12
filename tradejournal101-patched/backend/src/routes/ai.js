import express from 'express';
import { getInsights, chat } from '../controllers/aiController.js';

const router = express.Router();

router.post('/insights', getInsights);
router.post('/chat', chat);

export default router;
