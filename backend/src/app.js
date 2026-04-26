import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from './utils/passport.js';
import tradesRoutes from './routes/trades.js';
import analyticsRoutes from './routes/analytics.js';
import journalRoutes from './routes/journal.js';
import aiRoutes from './routes/ai.js';
import tagsRoutes from './routes/tags.js';
import emotionsRoutes from './routes/emotions.js';
import authRoutes from './routes/authRoutes.js';
import { authenticateToken } from './utils/authMiddleware.js';
import importRoutes from './routes/import.js';

const app = express();

app.use(cors({
  origin: ['https://tradejournal101-frontend.onrender.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(passport.initialize());

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
app.use('/api/import', authenticateToken, importRoutes);
export default app;
