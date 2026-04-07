import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getDbStatus } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (!getDbStatus()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    // Check if user already exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );

    const user = newUser.rows[0];

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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

    // Find user
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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
    // Mock sending code
    res.json({ message: 'Code sent successfully' });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyCode = async (req, res) => {
  try {
    const { contact, code, rememberMe } = req.body;

    if (!contact || !code) {
      return res.status(400).json({ error: 'Contact and code are required' });
    }

    if (!getDbStatus()) {
      // Mock login if DB is not connected
      const token = jwt.sign({ id: 'mock-id', email: contact }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
      });
      return res.json({
        user: { id: 'mock-id', name: 'User', email: contact },
        token
      });
    }

    // Find or create user
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

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
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
