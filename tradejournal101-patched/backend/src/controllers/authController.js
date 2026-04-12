import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getDbStatus } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

// Store verification codes in memory
const verificationCodes = new Map();

// Send email using Resend API (no SDK needed, just fetch)
const sendEmail = async (to, subject, html) => {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set. Skipping email send.');
    return { success: true, mock: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'TradeJournal <onboarding@resend.dev>',
      to: [to],
      subject,
      html
    })
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Resend error:', data);
    throw new Error(data.message || 'Failed to send email');
  }
  return data;
};

const generateCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (!getDbStatus()) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );
    const user = newUser.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!getDbStatus()) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
  try {
    if (!getDbStatus()) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const result = await query('SELECT id, name, email FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const sendCode = async (req, res) => {
  try {
    const { contact, method } = req.body;
    if (!contact) {
      return res.status(400).json({ error: 'Contact info is required' });
    }

    const code = generateCode();
    
    verificationCodes.set(contact, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0
    });

    if (method === 'email' || contact.includes('@')) {
      await sendEmail(
        contact,
        'TradeJournal - Баталгаажуулах код',
        `<div style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:20px;">
          <h2 style="color:#c8f07a;text-align:center;">TradeJournal</h2>
          <p style="text-align:center;color:#333;">Таны баталгаажуулах код:</p>
          <div style="background:#1a1a2e;color:#c8f07a;font-size:32px;font-weight:bold;text-align:center;padding:20px;border-radius:12px;letter-spacing:8px;margin:20px 0;">
            ${code}
          </div>
          <p style="text-align:center;color:#666;font-size:14px;">Энэ код 10 минутын дотор хүчинтэй.</p>
        </div>`
      );
      console.log(`Verification code sent to ${contact}`);
    } else {
      console.log(`SMS code for ${contact}: ${code}`);
    }

    res.json({ message: 'Code sent successfully' });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
};

export const verifyCode = async (req, res) => {
  try {
    const { contact, code, rememberMe } = req.body;
    if (!contact || !code) {
      return res.status(400).json({ error: 'Contact and code are required' });
    }

    const stored = verificationCodes.get(contact);
    
    if (!stored) {
      return res.status(400).json({ error: 'Код олдсонгүй. Дахин код авна уу.' });
    }
    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(contact);
      return res.status(400).json({ error: 'Кодын хугацаа дууссан. Дахин код авна уу.' });
    }
    stored.attempts += 1;
    if (stored.attempts > 5) {
      verificationCodes.delete(contact);
      return res.status(400).json({ error: 'Хэт олон оролдлого. Дахин код авна уу.' });
    }
    if (stored.code !== code) {
      return res.status(400).json({ error: 'Буруу код. Дахин оруулна уу.' });
    }

    verificationCodes.delete(contact);

    if (!getDbStatus()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    let user;
    const result = await query('SELECT * FROM users WHERE email = $1', [contact]);
    if (result.rows.length === 0) {
      const newUser = await query(
        'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email',
        [contact.split('@')[0], contact]
      );
      user = newUser.rows[0];
    } else {
      user = result.rows[0];
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    });

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token
    });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
};