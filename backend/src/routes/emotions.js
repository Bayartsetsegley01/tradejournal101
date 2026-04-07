import express from 'express';
import { getEmotions, createEmotion } from '../controllers/emotionController.js';

const router = express.Router();

router.get('/', getEmotions);
router.post('/', createEmotion);

export default router;
