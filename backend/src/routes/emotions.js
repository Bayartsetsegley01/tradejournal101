import express from 'express';
import { getEmotions, createEmotion, deleteEmotion } from '../controllers/emotionController.js';

const router = express.Router();

router.get('/', getEmotions);
router.post('/', createEmotion);
router.delete('/:id', deleteEmotion);

export default router;
