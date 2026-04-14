import express from 'express';
import { chat, getInsights } from '../controllers/aiController.js';

const router = express.Router();

router.post('/chat', chat);
router.post('/insights', getInsights);

export default router;
