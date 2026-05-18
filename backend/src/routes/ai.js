import express from 'express';
import { chat, getInsights, getSessions, getSession, deleteSession } from '../controllers/aiController.js';

const router = express.Router();

router.post('/chat', chat);
router.post('/insights', getInsights);

router.get('/sessions', getSessions);
router.get('/sessions/:id', getSession);
router.delete('/sessions/:id', deleteSession);

export default router;
