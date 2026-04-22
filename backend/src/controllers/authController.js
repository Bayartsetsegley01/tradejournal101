import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getDbStatus } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';
const verificationCodes = new Map();

const sendEmail = async (to, subject, html) => {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set.'); return { success: true, mock: true }; }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || 'TradeJournal <onboarding@resend.dev>', to: [to], subject, html })
  });
  const data = await response.json();
  if (!response.ok) { console.error('Resend error:', data); throw new Error(data.message || 'Failed to send email'); }
  return data;
};

const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();

const createToken = (user) => jwt.sign({ id: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '30d' });

const setCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
};

const updateLastLogin = async (userId) => {
  try { await query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [userId]); } catch (e) {}
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
    if (!getDbStatus()) return res.status(503).json({ error: 'Database not connected' });
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await query(
      `INSERT INTO users (name, email, password_hash, auth_provider, role, last_login_at)
       VALUES ($1, $2, $3, 'email', 'user', CURRENT_TIMESTAMP) RETURNING id, name, email, role`,
      [name, email, passwordHash]
    );
    const user = newUser.rows[0];
    const token = createToken(user);
    setCookie(res, token);
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (!getDbStatus()) return res.status(503).json({ error: 'Database not connected' });
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    if (!user.password_hash) return res.status(401).json({ error: 'Энэ имэйл Google-ээр бүртгүүлсэн. Google-ээр нэвтэрнэ үү.' });
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    await updateLastLogin(user.id);
    const token = createToken(user);
    setCookie(res, token);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { name, email, picture, googleId } = req.body;
    if (!email || !googleId) return res.status(400).json({ error: 'Google auth data is required' });
    if (!getDbStatus()) return res.status(503).json({ error: 'Database not connected' });

    let result = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    let user;

    if (result.rows.length > 0) {
      user = result.rows[0];
      await query('UPDATE users SET avatar_url = $1, last_login_at = CURRENT_TIMESTAMP WHERE id = $2', [picture || user.avatar_url, user.id]);
    } else {
      result = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        user = result.rows[0];
        await query('UPDATE users SET google_id = $1, avatar_url = $2, auth_provider = $3, last_login_at = CURRENT_TIMESTAMP WHERE id = $4',
          [googleId, picture || null, user.auth_provider === 'email' ? 'both' : 'google', user.id]);
        user.avatar_url = picture;
      } else {
        const newUser = await query(
          `INSERT INTO users (name, email, google_id, avatar_url, auth_provider, role, last_login_at)
           VALUES ($1, $2, $3, $4, 'google', 'user', CURRENT_TIMESTAMP)
           RETURNING id, name, email, role, avatar_url`,
          [name || email.split('@')[0], email, googleId, picture || null]
        );
        user = newUser.rows[0];
      }
    }

    const token = createToken(user);
    setCookie(res, token);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user', avatar_url: user.avatar_url }, token });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google нэвтрэлт амжилтгүй боллоо.' });
  }
};

export const logout = (req, res) => { res.clearCookie('token'); res.json({ message: 'Logged out successfully' }); };

export const getMe = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ error: 'Database not connected' });
    const result = await query('SELECT id, name, email, role, avatar_url, auth_provider FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (error) { console.error('GetMe error:', error); res.status(500).json({ error: 'Server error' }); }
};

export const sendCode = async (req, res) => {
  try {
    const { contact, method } = req.body;
    if (!contact) return res.status(400).json({ error: 'Contact info is required' });
    const code = generateCode();
    verificationCodes.set(contact, { code, expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 });
    if (method === 'email' || contact.includes('@')) {
      await sendEmail(contact, 'TradeJournal - Баталгаажуулах код',
        `<div style="font-family:Arial;max-width:400px;margin:0 auto;padding:20px;"><h2 style="color:#c8f07a;text-align:center;">TradeJournal</h2><p style="text-align:center;color:#333;">Таны баталгаажуулах код:</p><div style="background:#1a1a2e;color:#c8f07a;font-size:32px;font-weight:bold;text-align:center;padding:20px;border-radius:12px;letter-spacing:8px;margin:20px 0;">${code}</div><p style="text-align:center;color:#666;font-size:14px;">10 минутын дотор хүчинтэй.</p></div>`);
    }
    res.json({ message: 'Code sent successfully' });
  } catch (error) { console.error('Send code error:', error); res.status(500).json({ error: 'Failed to send verification code' }); }
};

export const verifyCode = async (req, res) => {
  try {
    const { contact, code } = req.body;
    if (!contact || !code) return res.status(400).json({ error: 'Contact and code are required' });
    const stored = verificationCodes.get(contact);
    if (!stored) return res.status(400).json({ error: 'Код олдсонгүй.' });
    if (Date.now() > stored.expiresAt) { verificationCodes.delete(contact); return res.status(400).json({ error: 'Кодын хугацаа дууссан.' }); }
    stored.attempts += 1;
    if (stored.attempts > 5) { verificationCodes.delete(contact); return res.status(400).json({ error: 'Хэт олон оролдлого.' }); }
    if (stored.code !== code) return res.status(400).json({ error: 'Буруу код.' });
    verificationCodes.delete(contact);
    if (!getDbStatus()) return res.status(503).json({ error: 'Database not connected' });
    let user;
    const result = await query('SELECT * FROM users WHERE email = $1', [contact]);
    if (result.rows.length === 0) {
      const newUser = await query('INSERT INTO users (name, email, auth_provider, role, last_login_at) VALUES ($1, $2, \'email\', \'user\', CURRENT_TIMESTAMP) RETURNING id, name, email, role', [contact.split('@')[0], contact]);
      user = newUser.rows[0];
    } else { user = result.rows[0]; await updateLastLogin(user.id); }
    const token = createToken(user);
    setCookie(res, token);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user' }, token });
  } catch (error) { console.error('Verify code error:', error); res.status(500).json({ error: 'Server error' }); }
};
