// AI Service — Claude API (Anthropic) ашиглан арилжааны анализ хийх

export const generateInsights = async (tradesData) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY is not set. Returning null.');
    return null;
  }

  try {
    const formattedTrades = tradesData.map(t => ({
      date: t.exit_date || t.entry_date,
      market: t.market_type,
      symbol: t.symbol,
      direction: t.direction,
      pnl: t.pnl,
      rr: t.rr_ratio,
      strategy: t.strategy,
      notes: t.notes,
      lessons: t.lessons_learned,
      emotionBefore: t.emotion_before,
      emotionAfter: t.emotion_after,
      positiveTags: t.positive_tags,
      mistakeTags: t.mistake_tags,
      whyEntered: t.why_entered,
      whatHappened: t.what_happened,
    }));

    const systemPrompt = `Та мэргэшсэн арилжааны сэтгэл судлаач болон шинжээч.
Хэрэглэгчийн арилжааны дата-г шинжлэн монгол хэл дээр тодорхой, практик зөвлөмж өгнө.
Заавал JSON форматаар хариулна. JSON-оос өөр ямар ч текст, тайлбар оруулахгүй.`;

    const userPrompt = `Дараах арилжааны өдрийн тэмдэглэлийн дата-г шинжлээрэй:

${JSON.stringify(formattedTrades, null, 2)}

Дараах JSON бүтцээр хариулна уу:
{
  "summary": "Трейдерийн ерөнхий гүйцэтгэлийн товч дүгнэлт (2-3 өгүүлбэр)",
  "mistakes": ["Алдаа 1", "Алдаа 2", "Алдаа 3"],
  "strengths": ["Давуу тал 1", "Давуу тал 2", "Давуу тал 3"],
  "advice": "Дараагийн арилжааны сессид хэрэгжүүлэх нэг тодорхой зөвлөмж"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Claude API error:', err);
      return null;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim();
    if (!text) return null;

    const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(clean);
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return null;
  }
};

// Chat endpoint — арилжааны контекст дахь чат
export const chatWithAI = async (messages, tradesContext = []) => {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const contextSummary = tradesContext.length > 0
      ? `Хэрэглэгчийн сүүлийн ${tradesContext.length} арилжааны товч:\n` +
        tradesContext.slice(0, 20).map(t =>
          `- ${t.symbol} ${t.direction} PnL:${t.pnl}${t.emotion_before ? ' Сэтгэл:'+t.emotion_before : ''}`
        ).join('\n')
      : 'Арилжааны дата байхгүй.';

    const systemPrompt = `Та TradeJournal101 апп-ийн арилжааны AI зөвлөх.
Хэрэглэгчийн арилжааны дата-д суурилан монгол хэлээр тусална.
Хэрэглэгчийн арилжааны контекст:\n${contextSummary}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.content?.[0]?.text || null;
  } catch (error) {
    console.error('Chat AI error:', error);
    return null;
  }
};
