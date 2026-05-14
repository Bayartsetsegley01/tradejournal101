import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { getApiKey, generateApiKey, syncTrade } from '../controllers/mt5Controller.js';

const router = express.Router();

router.get('/apikey', authenticateToken, getApiKey);
router.post('/apikey', authenticateToken, generateApiKey);
router.post('/sync', apiKeyAuth, syncTrade);

export default router;
