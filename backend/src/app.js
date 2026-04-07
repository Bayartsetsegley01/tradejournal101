import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import tradesRoutes from './routes/trades.js';
import analyticsRoutes from './routes/analytics.js';
import journalRoutes from './routes/journal.js';
import aiRoutes from './routes/ai.js';
import tagsRoutes from './routes/tags.js';
import emotionsRoutes from './routes/emotions.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trades', tradesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/emotions', emotionsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

export default app;
