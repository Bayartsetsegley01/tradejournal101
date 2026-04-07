import { generateInsights } from '../services/aiService.js';
import { mockAiInsights, mockTrades } from '../utils/mockData.js';
import { query, getDbStatus } from '../db/index.js';

export const getInsights = async (req, res) => {
  try {
    let tradesData = req.body;
    
    // If no trades provided in body, fetch from DB
    if (!tradesData || tradesData.length === 0) {
      if (getDbStatus()) {
        const result = await query("SELECT * FROM trades WHERE status = 'CLOSED' ORDER BY exit_date DESC LIMIT 50");
        tradesData = result.rows;
      } else {
        tradesData = mockTrades.filter(t => t.status === 'CLOSED');
      }
    }

    if (!tradesData || tradesData.length === 0) {
      return res.json({ 
        success: true, 
        data: {
          summary: "Арилжааны дата олдсонгүй.",
          mistakes: [],
          advice: "Арилжаануудаа бүртгэж эхлээрэй."
        },
        mode: 'mock'
      });
    }

    const insights = await generateInsights(tradesData);
    
    if (insights) {
      res.json({ success: true, data: insights, mode: 'ai' });
    } else {
      // Fallback to mock if AI fails or no API key
      res.json({ success: true, data: mockAiInsights, mode: 'mock' });
    }
  } catch (error) {
    console.error("AI Controller Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
