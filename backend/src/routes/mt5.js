import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import {
  getApiKey, generateApiKey, syncTrade,
  connectMetaApi, getMetaApiStatus, syncMetaApiHistory, disconnectMetaApi,
} from '../controllers/mt5Controller.js';

const router = express.Router();

// EA key routes
router.get('/apikey', authenticateToken, getApiKey);
router.post('/apikey', authenticateToken, generateApiKey);
router.post('/sync', apiKeyAuth, syncTrade);

// MetaApi routes
router.post('/connect', authenticateToken, connectMetaApi);
router.get('/status', authenticateToken, getMetaApiStatus);
router.post('/sync-history', authenticateToken, syncMetaApiHistory);
router.delete('/disconnect', authenticateToken, disconnectMetaApi);

export default router;
