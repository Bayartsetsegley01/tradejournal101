import express from 'express';
import { chat, getInsights } from '../controllers/aiController.js';
import { authenticateToken } from '../utils/authMiddleware.js';

const router = express.Router();

// All AI routes require auth
router.use(authenticateToken);

router.post('/chat', chat);
router.post('/insights', getInsights);

export default router;
