import { generateInsights, chatWithAI } from '../services/aiService.js';
import { mockAiInsights, mockTrades } from '../utils/mockData.js';
import { query, getDbStatus } from '../db/index.js';

export const getInsights = async (req, res) => {
  try {
    let tradesData = req.body;

    if (!tradesData || tradesData.length === 0) {
      if (getDbStatus()) {
        const result = await query(
          `SELECT * FROM trades WHERE user_id=$1 AND status='CLOSED' ORDER BY exit_date DESC LIMIT 50`,
          [req.user.id]
        );
        tradesData = result.rows;
      } else {
        tradesData = mockTrades.filter(t => t.status === 'CLOSED');
      }
    }

    if (!tradesData || tradesData.length === 0) {
      return res.json({
        success: true,
        data: { summary: 'Арилжааны дата олдсонгүй.', mistakes: [], strengths: [], advice: 'Арилжаануудаа бүртгэж эхлээрэй.' },
        mode: 'empty'
      });
    }

    const insights = await generateInsights(tradesData);
    if (insights) {
      res.json({ success: true, data: insights, mode: 'ai' });
    } else {
      res.json({ success: true, data: mockAiInsights, mode: 'mock' });
    }
  } catch (error) {
    console.error('AI Controller Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const chat = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: 'messages required' });
    }

    let trades = [];
    if (getDbStatus()) {
      const result = await query(
        `SELECT symbol, direction, pnl, emotion_before, emotion_after, positive_tags, mistake_tags
         FROM trades WHERE user_id=$1 AND status='CLOSED' ORDER BY exit_date DESC LIMIT 30`,
        [req.user.id]
      );
      trades = result.rows;
    }

    const reply = await chatWithAI(messages, trades);
    if (reply) {
      res.json({ success: true, data: reply });
    } else {
      res.json({ success: true, data: 'Уучлаарай, AI-тай холбогдоход алдаа гарлаа. ANTHROPIC_API_KEY шалгана уу.' });
    }
  } catch (error) {
    console.error('Chat Controller Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
