import express from 'express';
import { getJournal, saveJournal } from '../controllers/journalController.js';

const router = express.Router();

router.get('/:tradeId', getJournal);
router.post('/:tradeId', saveJournal);

export default router;
