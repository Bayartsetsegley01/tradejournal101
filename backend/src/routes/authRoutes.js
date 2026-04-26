
import express from 'express';
import jwt from 'jsonwebtoken';
import passport from '../utils/passport.js';
import { register, login, logout, getMe, sendCode, verifyCode, googleAuth } from '../controllers/authController.js';
import { authenticateToken } from '../utils/authMiddleware.js';
import { query } from '../db/index.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/send-code', sendCode);
router.post('/verify-code', verifyCode);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);

router.post('/make-admin', async (req, res) => {
  try {
    const { email, secret } = req.body;
    if (secret !== JWT_SECRET) return res.status(403).json({ error: 'Forbidden' });
    await query('UPDATE users SET role = $1 WHERE email = $2', ['admin', email]);
    res.json({ success: true, message: `${email} is now admin` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/google/redirect', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.redirect(`${FRONTEND_URL}/dashboard`);
  }
);

export default router;