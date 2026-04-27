import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getDbStatus } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';
const verificationCodes = new Map();

const sendEmail = async (to, subject, html) => {
  const KEY = process.env.RESEND_API_KEY;
  if (!KEY) { console.warn('RESEND_API_KEY not set'); return { mock: true }; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || 'TradeJournal <onboarding@resend.dev>', to: [to], subject, html }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || 'Email send failed');
  return data;
};

const verifHtml = (code) =>
  `<div style="font-family:Arial;max-width:420px;margin:0 auto;padding:24px;background:#0f172a;border-radius:16px;">
    <h2 style="color:#c8f07a;text-align:center;">TradeJournal</h2>
    <p style="text-align:center;color:#94a3b8;">И-мэйл баталгаажуулах код:</p>
    <div style="background:#1e293b;color:#c8f07a;font-size:36px;font-weight:bold;text-align:center;padding:24px;border-radius:12px;letter-spacing:12px;margin:16px 0;">${code}</div>
    <p style="text-align:center;color:#64748b;font-size:13px;">10 минутын дотор хүчинтэй.</p>
  </div>`;

const gen4 = () => Math.floor(1000 + Math.random() * 9000).toString();
const gen6 = () => Math.floor(100000 + Math.random() * 900000).toString();
const createToken = (u) => jwt.sign({ id: u.id, email: u.email, role: u.role || 'user' }, JWT_SECRET, { expiresIn: '30d' });
const setCookie = (res, token) => res.cookie('token', token, {
  httpOnly: true, secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
});
const updateLastLogin = async (id) => { try { await query('UPDATE users SET last_login_at=NOW() WHERE id=$1', [id]); } catch {} };

// Register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Бүх талбарыг бөглөнө үү' });
    if (!getDbStatus()) return res.status(503).json({ error: 'Database not connected' });

    const existing = await query('SELECT id, email_verified FROM users WHERE email=$1', [email]);
    if (existing.rows[0]) {
      if (!existing.rows[0].email_verified) {
        const code = gen6();
        await query("UPDATE users SET verification_code=$1, verification_expires=NOW()+INTERVAL '10 minutes' WHERE email=$2", [code, email]);
        try { await sendEmail(email, 'TradeJournal — И-мэйл баталгаажуулах', verifHtml(code)); } catch (emailErr) { console.warn('Email send failed:', emailErr.message); }
        return res.json({ requiresVerification: true, email });
      }
      return res.status(400).json({ error: 'Энэ имэйл аль хэдийн бүртгэлтэй байна' });
    }

    const hash = await bcrypt.hash(password, 10);
    const code = gen6();
    await query(
      `INSERT INTO users (name,email,password_hash,auth_provider,role,email_verified,verification_code,verification_expires)
       VALUES ($1,$2,$3,'email','user',false,$4,NOW()+INTERVAL '10 minutes')`,
      [name, email, hash, code]
    );
    try {
      await sendEmail(email, 'TradeJournal — И-мэйл баталгаажуулах', verifHtml(code));
    } catch (emailErr) {
      console.warn('register email failed:', emailErr.message);
      console.log(`[DEV] register verification code for ${email}: ${code}`);
    }
    res.status(201).json({ requiresVerification: true, email });
  } catch (e) { console.error('register:', e); res.status(500).json({ error: 'Бүртгэлд алдаа гарлаа' }); }
};

// Verify email (6-digit code)
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code required' });
    if (!getDbStatus()) return res.status(503).json({ error: 'Database not connected' });

    const r = await query(
      'SELECT * FROM users WHERE email=$1 AND verification_code=$2 AND verification_expires>NOW()',
      [email, code]
    );
    if (!r.rows[0]) {
      const expired = await query('SELECT id FROM users WHERE email=$1 AND verification_code=$2', [email, code]);
      if (expired.rows[0]) return res.status(400).json({ error: 'Кодын хугацаа дуусав. Дахин код авна уу.' });
      return res.status(400).json({ error: 'Код буруу байна' });
    }

    const user = r.rows[0];
    await query('UPDATE users SET email_verified=true,verification_code=NULL,verification_expires=NULL,last_login_at=NOW() WHERE id=$1', [user.id]);
    const token = createToken(user);
    setCookie(res, token);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, onboarding_completed: user.onboarding_completed || false }, token });
  } catch (e) { console.error('verifyEmail:', e); res.status(500).json({ error: 'Server error' }); }
};

// Resend verification code
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const r = await query('SELECT id, email_verified FROM users WHERE email=$1', [email]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' });
    if (r.rows[0].email_verified) return res.status(400).json({ error: 'И-мэйл аль хэдийн баталгаажсан' });
    const code = gen6();
    await query("UPDATE users SET verification_code=$1,verification_expires=NOW()+INTERVAL '10 minutes' WHERE email=$2", [code, email]);
    try {
      await sendEmail(email, 'TradeJournal — И-мэйл баталгаажуулах', verifHtml(code));
    } catch (emailErr) {
      console.warn('resendVerification email failed:', emailErr.message);
      console.log(`[DEV] resend verification code for ${email}: ${code}`);
    }
    res.json({ message: 'Код дахин илгээлээ' });
  } catch (e) { console.error('resendVerification:', e); res.status(500).json({ error: 'Server error' }); }
};

// Complete onboarding
export const completeOnboarding = async (req, res) => {
  try {
    const { trader_profile } = req.body;
    await query('UPDATE users SET trader_profile=$1,onboarding_completed=true WHERE id=$2', [JSON.stringify(trader_profile || {}), req.user.id]);
    res.json({ success: true });
  } catch (e) { console.error('completeOnboarding:', e); res.status(500).json({ error: 'Server error' }); }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'И-мэйл болон нууц үгээ оруулна уу' });
    if (!getDbStatus()) return res.status(503).json({ error: 'Database not connected' });

    const r = await query('SELECT * FROM users WHERE email=$1', [email]);
    if (!r.rows[0]) return res.status(401).json({ error: 'И-мэйл эсвэл нууц үг буруу байна' });
    const user = r.rows[0];
    if (!user.password_hash) return res.status(401).json({ error: 'Энэ имэйл Google-ээр бүртгүүлсэн. Google-ээр нэвтэрнэ үү.' });
    if (!await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ error: 'И-мэйл эсвэл нууц үг буруу байна' });

    if (!user.email_verified) {
      const code = gen6();
      await query("UPDATE users SET verification_code=$1,verification_expires=NOW()+INTERVAL '10 minutes' WHERE id=$2", [code, user.id]);
      try { await sendEmail(email, 'TradeJournal — И-мэйл баталгаажуулах', verifHtml(code)); } catch (emailErr) { console.warn('Login verify email failed:', emailErr.message); }
      return res.status(401).json({ error: 'И-мэйлээ баталгаажуулна уу', requiresVerification: true, email });
    }

    await updateLastLogin(user.id);
    const token = createToken(user);
    setCookie(res, token);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url, onboarding_completed: user.onboarding_completed || false }, token });
  } catch (e) { console.error('login:', e); res.status(500).json({ error: 'Нэвтрэхэд алдаа гарлаа' }); }
};

// Google auth (client-side POST)
export const googleAuth = async (req, res) => {
  try {
    const { name, email, picture, googleId } = req.body;
    if (!email || !googleId) return res.status(400).json({ error: 'Google auth data required' });
    if (!getDbStatus()) return res.status(503).json({ error: 'Database not connected' });

    let r = await query('SELECT * FROM users WHERE google_id=$1', [googleId]);
    let user;

    if (r.rows[0]) {
      user = r.rows[0];
      await query('UPDATE users SET avatar_url=$1,last_login_at=NOW(),email_verified=true WHERE id=$2', [picture || user.avatar_url, user.id]);
    } else {
      r = await query('SELECT * FROM users WHERE email=$1', [email]);
      if (r.rows[0]) {
        user = r.rows[0];
        await query('UPDATE users SET google_id=$1,avatar_url=$2,auth_provider=$3,email_verified=true,last_login_at=NOW() WHERE id=$4',
          [googleId, picture || null, user.auth_provider === 'email' ? 'both' : 'google', user.id]);
        user.avatar_url = picture;
      } else {
        const newUser = await query(
          `INSERT INTO users (name,email,google_id,avatar_url,auth_provider,role,email_verified,last_login_at)
           VALUES ($1,$2,$3,$4,'google','user',true,NOW()) RETURNING id,name,email,role,avatar_url,onboarding_completed`,
          [name || email.split('@')[0], email, googleId, picture || null]
        );
        user = newUser.rows[0];
      }
    }

    const token = createToken(user);
    setCookie(res, token);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user', avatar_url: user.avatar_url, onboarding_completed: user.onboarding_completed || false }, token });
  } catch (e) { console.error('googleAuth:', e); res.status(500).json({ error: 'Google нэвтрэлт амжилтгүй боллоо.' }); }
};

export const logout = (req, res) => { res.clearCookie('token'); res.json({ message: 'Logged out' }); };

export const getMe = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ error: 'Database not connected' });
    const r = await query(
      'SELECT id,name,email,role,avatar_url,auth_provider,onboarding_completed,trader_profile FROM users WHERE id=$1',
      [req.user.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: r.rows[0] });
  } catch (e) { console.error('getMe:', e); res.status(500).json({ error: 'Server error' }); }
};

export const sendCode = async (req, res) => {
  try {
    const { contact, method } = req.body;
    if (!contact) return res.status(400).json({ error: 'Contact required' });
    const code = gen4();
    verificationCodes.set(contact, { code, expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 });
    if (method === 'email' || contact.includes('@')) {
      try {
        await sendEmail(contact, 'TradeJournal — Баталгаажуулах код',
          `<div style="font-family:Arial;max-width:400px;margin:0 auto;padding:20px;text-align:center;">
            <h2 style="color:#c8f07a;">TradeJournal</h2>
            <div style="background:#1a1a2e;color:#c8f07a;font-size:32px;font-weight:bold;padding:20px;border-radius:12px;letter-spacing:8px;margin:20px 0;">${code}</div>
            <p style="color:#666;font-size:14px;">10 минутын дотор хүчинтэй.</p>
          </div>`);
      } catch (emailErr) {
        console.warn('sendCode email failed:', emailErr.message);
        console.log(`[DEV] sendCode verification code for ${contact}: ${code}`);
      }
    }
    res.json({ message: 'Code sent' });
  } catch (e) { console.error('sendCode:', e); res.status(500).json({ error: 'Failed to send code' }); }
};

export const verifyCode = async (req, res) => {
  try {
    const { contact, code } = req.body;
    if (!contact || !code) return res.status(400).json({ error: 'Contact and code required' });
    const stored = verificationCodes.get(contact);
    if (!stored) return res.status(400).json({ error: 'Код олдсонгүй.' });
    if (Date.now() > stored.expiresAt) { verificationCodes.delete(contact); return res.status(400).json({ error: 'Кодын хугацаа дууссан.' }); }
    stored.attempts += 1;
    if (stored.attempts > 5) { verificationCodes.delete(contact); return res.status(400).json({ error: 'Хэт олон оролдлого.' }); }
    if (stored.code !== code) return res.status(400).json({ error: 'Буруу код.' });
    verificationCodes.delete(contact);
    if (!getDbStatus()) return res.status(503).json({ error: 'Database not connected' });
    let user;
    const r = await query('SELECT * FROM users WHERE email=$1', [contact]);
    if (!r.rows[0]) {
      const nu = await query(
        "INSERT INTO users (name,email,auth_provider,role,email_verified,last_login_at) VALUES ($1,$2,'email','user',true,NOW()) RETURNING id,name,email,role,onboarding_completed",
        [contact.split('@')[0], contact]
      );
      user = nu.rows[0];
    } else {
      user = r.rows[0];
      await query('UPDATE users SET email_verified=true,last_login_at=NOW() WHERE id=$1', [user.id]);
    }
    const token = createToken(user);
    setCookie(res, token);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user', onboarding_completed: user.onboarding_completed || false }, token });
  } catch (e) { console.error('verifyCode:', e); res.status(500).json({ error: 'Server error' }); }
};
