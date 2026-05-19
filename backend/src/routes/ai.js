import express from 'express';
import { chat, getInsights } from '../controllers/aiController.js';
import {
  getSessions, createSession, getMessages,
  deleteSession, saveMessage, updateSession,
} from '../controllers/aiSessionController.js';

const router = express.Router();

router.post('/chat',    chat);
router.post('/insights', getInsights);

router.get('/sessions',                  getSessions);
router.post('/sessions',                 createSession);
router.get('/sessions/:id/messages',     getMessages);
router.delete('/sessions/:id',           deleteSession);
router.post('/sessions/:id/messages',    saveMessage);
router.patch('/sessions/:id',            updateSession);

export default router;
