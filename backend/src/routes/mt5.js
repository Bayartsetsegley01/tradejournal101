import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import {
  connectAccount, syncAccount, getAccounts, deleteAccount,
  eaSyncTrade, getApiKey, generateApiKey,
} from '../controllers/mt5Controller.js';

const router = express.Router();

// Auto-Sync (JWT auth)
router.post('/connect',            authenticateToken, connectAccount);
router.post('/sync/:accountId',    authenticateToken, syncAccount);
router.get('/accounts',            authenticateToken, getAccounts);
router.delete('/accounts/:id',     authenticateToken, deleteAccount);

// EA API key management (JWT auth)
router.get('/apikey',              authenticateToken, getApiKey);
router.post('/apikey',             authenticateToken, generateApiKey);

// EA real-time push (API key auth — no JWT)
router.post('/ea-sync',            apiKeyAuth, eaSyncTrade);
router.post('/sync',               apiKeyAuth, eaSyncTrade); // backward compat for existing EA installations

export default router;
