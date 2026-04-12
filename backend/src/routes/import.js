import express from 'express';
import { importTrades } from '../controllers/importController.js';

const router = express.Router();

router.post('/trades', importTrades);

export default router;
