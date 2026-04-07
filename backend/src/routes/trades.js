import express from 'express';
import { getTrades, getTradeById, addTrade, updateTrade, deleteTrade, updateTradeNotes, addTradeMedia } from '../controllers/tradeController.js';

const router = express.Router();

router.get('/', getTrades);
router.get('/:id', getTradeById);
router.post('/', addTrade);
router.patch('/:id', updateTrade);
router.delete('/:id', deleteTrade);
router.patch('/:id/notes', updateTradeNotes);
router.post('/:id/media', addTradeMedia);

export default router;
