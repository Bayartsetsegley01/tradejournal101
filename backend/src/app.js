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
import { authenticateToken } from './utils/authMiddleware.js';

dotenv.config();
const app = express();

app.use(cors({
  origin: ['https://tradejournal101-frontend.onrender.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Public routes
app.use('/api/auth', authRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Protected routes - authenticateToken applied once here
app.use('/api/trades', authenticateToken, tradesRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/journal', authenticateToken, journalRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/tags', authenticateToken, tagsRoutes);
app.use('/api/emotions', authenticateToken, emotionsRoutes);

export default app;
