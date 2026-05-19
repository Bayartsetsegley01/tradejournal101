import Anthropic from '@anthropic-ai/sdk';
import { query, getDbStatus } from '../config/database.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const isQuotaError = (err) =>
  err?.status === 402 ||
  err?.status === 529 ||
  /credit|billing|quota|payment|insufficient/i.test(err?.message || '');

const MODE_PROMPTS = {
  analysis: 'Хэрэглэгчийн арилжааны дата-г гүнзгий шинжилж, тоо баримтад суурилсан ажиглалт хий. Хэв маяг, давтагдсан алдаа, давуу талуудыг тодорхойл.',
  advice:   'Практик, хэрэгжүүлэх боломжтой зөвлөгөө өг. Тодорхой алхамуудыг дугаарлаж жагсаа. Стратеги, эрсдэлийн удирдлага дээр анхаарал хандуул.',
  learning: 'Боловсролын горимд ажиллана уу. Ойлгомжтой тайлбар, жишээ, аналоги ашигла. Арилжааны суурь болон дэвшилтэт ойлголтуудыг тайлбарла.',
};

const buildSystemPrompt = async (tradeContext, userId, mode = 'analysis') => {
  let prompt = `Та бол мэргэжлийн арилжааны зөвлөх AI юм. Монгол хэлээр богино, тодорхой хариулт өгнө.
Хариултаа 3-5 өгүүлбэрт хэмжлэг. Markdown **bold** ашиглаж болно.
Арилжааны психологи, эрсдэлийн удирдлага, техникийн анализын мэргэжилтэн.

Одоогийн горим: ${MODE_PROMPTS[mode] || MODE_PROMPTS.analysis}`;

  if (tradeContext) {
    prompt += `\n\nХэрэглэгчийн арилжааны статистик:
- Нийт хаасан арилжаа: ${tradeContext.totalTrades}
- Win Rate: ${tradeContext.winRate}%
- Нийт PnL: ${tradeContext.totalPnl}
- Сүүлийн арилжаанууд: ${JSON.stringify(tradeContext.recentTrades, null, 2)}`;
  } else if (getDbStatus() && userId) {
    try {
      const result = await query(
        `SELECT symbol, direction, pnl, emotion_before, emotion_after, strategy, mistake_tags, positive_tags
         FROM trades WHERE user_id=$1 AND status='CLOSED' ORDER BY created_at DESC LIMIT 10`,
        [userId]
      );
      if (result.rows.length > 0) {
        const trades = result.rows;
        const wins = trades.filter(t => parseFloat(t.pnl) > 0);
        prompt += `\n\nХэрэглэгчийн сүүлийн ${trades.length} арилжааны мэдээлэл:
- Win Rate: ${((wins.length / trades.length) * 100).toFixed(0)}%
- Арилжаанууд: ${JSON.stringify(trades)}`;
      }
    } catch (e) {
      console.error('Failed to fetch trade context:', e);
    }
  }
  return prompt;
};

// POST /api/ai/chat  — session management is handled by frontend
export const chat = async (req, res) => {
  try {
    const { message, history = [], tradeContext, mode = 'analysis' } = req.body;
    const userId = req.user.id;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ success: false, error: 'AI API not configured' });
    }

    const systemPrompt = await buildSystemPrompt(tradeContext, userId, mode);

    const claudeMessages = [
      ...history.slice(-18).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const reply = response.content[0]?.text || 'Хариулт авах боломжгүй байна.';
    res.json({ success: true, reply });
  } catch (error) {
    console.error('AI chat error:', error);
    if (isQuotaError(error)) {
      return res.status(402).json({ success: false, code: 'AI_QUOTA', error: 'AI функц түр ажиллахгүй байна' });
    }
    res.status(500).json({ success: false, error: 'AI хариулт авах боломжгүй байна.' });
  }
};

// POST /api/ai/insights
export const getInsights = async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ success: false, error: 'AI API not configured' });
    }

    let tradesData = Array.isArray(req.body) ? req.body : [];

    if (!tradesData.length && getDbStatus()) {
      const result = await query(
        `SELECT * FROM trades WHERE user_id=$1 AND status='CLOSED' ORDER BY exit_date DESC LIMIT 50`,
        [req.user.id]
      );
      tradesData = result.rows;
    }

    if (!tradesData.length) {
      return res.json({
        success: true,
        data: { summary: 'Арилжааны дата олдсонгүй.', mistakes: [], strengths: [], advice: 'Арилжаануудаа бүртгэж эхлээрэй.' },
        mode: 'empty',
      });
    }

    const prompt = `Дараах арилжааны тэмдэглэлийн өгөгдлийг шинжил. Монгол хэлээр JSON форматаар хариулт өг.

Өгөгдөл: ${JSON.stringify(tradesData.slice(0, 30), null, 2)}

Зөвхөн дараах JSON бүтэцтэй хариулт өг (өөр текст битгий нэмэ):
{
  "summary": "Ерөнхий дүгнэлт (2-3 өгүүлбэр)",
  "mistakes": ["Алдаа 1", "Алдаа 2", "Алдаа 3"],
  "strengths": ["Давуу тал 1", "Давуу тал 2"],
  "advice": "Дараагийн арилжааны зөвлөгөө (1 өгүүлбэр)"
}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, mistakes: [], strengths: [], advice: '' };

    res.json({ success: true, data: insights, mode: 'ai' });
  } catch (error) {
    console.error('AI insights error:', error);
    if (isQuotaError(error)) {
      return res.status(402).json({ success: false, code: 'AI_QUOTA', error: 'AI функц түр ажиллахгүй байна' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};
