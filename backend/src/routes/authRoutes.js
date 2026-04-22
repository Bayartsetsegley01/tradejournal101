import express from 'express';
import { register, login, logout, getMe, sendCode, verifyCode, googleAuth } from '../controllers/authController.js';
import { authenticateToken } from '../utils/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/send-code', sendCode);
router.post('/verify-code', verifyCode);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);

export default router;
