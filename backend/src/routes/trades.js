import express from 'express';
import { getTrades, getTradeById, addTrade, updateTrade, deleteTrade, updateTradeNotes, addTradeMedia, removeTradeMedia } from '../controllers/tradeController.js';
import { importTrades } from '../controllers/importController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/', getTrades);
router.post('/', addTrade);
router.post('/import', importTrades);
router.get('/:id', getTradeById);
router.patch('/:id', updateTrade);
router.delete('/:id', deleteTrade);
router.patch('/:id/notes', updateTradeNotes);
router.post('/:id/media', upload.single('image'), addTradeMedia);
router.delete('/:id/media', removeTradeMedia);

export default router;