import express from 'express';
import { getTrades, getTradeById, addTrade, updateTrade, deleteTrade, updateTradeNotes, addTradeMedia } from '../controllers/tradeController.js';
import { importTrades } from '../controllers/importController.js';

const router = express.Router();

router.get('/', getTrades);
router.post('/', addTrade);
router.post('/import', importTrades);
router.get('/:id', getTradeById);
router.patch('/:id', updateTrade);
router.delete('/:id', deleteTrade);
router.patch('/:id/notes', updateTradeNotes);
router.post('/:id/media', addTradeMedia);

export default router;