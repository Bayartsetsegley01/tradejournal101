export const mockTrades = Array.from({ length: 24 }).map((_, i) => {
  const isWin = Math.random() > 0.4;
  const direction = Math.random() > 0.5 ? 'LONG' : 'SHORT';
  const entryPrice = 100 + Math.random() * 1000;
  const risk = entryPrice * 0.02;
  const exitPrice = isWin 
    ? (direction === 'LONG' ? entryPrice + risk * 2 : entryPrice - risk * 2)
    : (direction === 'LONG' ? entryPrice - risk : entryPrice + risk);
  const pnl = isWin ? 200 + Math.random() * 500 : -(100 + Math.random() * 200);
  
  // Distribute over 6 months starting from Nov 2025 (Month 10 in JS Date)
  // 4 trades per month
  const monthOffset = Math.floor(i / 4);
  const dayOffset = (i % 4) * 7 + Math.floor(Math.random() * 5); // Spread within the month
  const tradeDate = new Date(2025, 10 + monthOffset, 1 + dayOffset, 10, 30);
  const exitDate = new Date(tradeDate.getTime() + (2 + Math.random() * 4) * 60 * 60 * 1000); // 2-6 hours later

  const markets = [
    { type: 'forex', symbol: 'EURUSD' },
    { type: 'forex', symbol: 'GBPUSD' },
    { type: 'crypto', symbol: 'BTCUSDT' },
    { type: 'crypto', symbol: 'ETHUSDT' },
    { type: 'stocks', symbol: 'AAPL' },
    { type: 'stocks', symbol: 'TSLA' },
    { type: 'gold', symbol: 'XAUUSD' }
  ];
  const market = markets[i % markets.length];

  return {
    id: (i + 1).toString(),
    status: 'CLOSED',
    symbol: market.symbol,
    market_type: market.type,
    direction,
    strategy: ['Breakout', 'Trend Following', 'Reversal', 'Scalping'][Math.floor(Math.random() * 4)],
    session: ['new_york', 'london', 'tokyo', 'sydney'][Math.floor(Math.random() * 4)],
    entry_date: tradeDate.toISOString(),
    exit_date: exitDate.toISOString(),
    entry_price: entryPrice.toFixed(2),
    exit_price: exitPrice.toFixed(2),
    stop_loss: (direction === 'LONG' ? entryPrice - risk : entryPrice + risk).toFixed(2),
    take_profit: (direction === 'LONG' ? entryPrice + risk * 2 : entryPrice - risk * 2).toFixed(2),
    position_size: (Math.random() * 5).toFixed(2),
    pnl: parseFloat(pnl.toFixed(2)),
    rr_ratio: 2.0,
    notes: isWin ? 'Perfect setup according to plan. Waited for confirmation.' : 'Entered too early out of FOMO.',
    lessons_learned: isWin ? 'Patience pays off. Let the trade come to me.' : 'Need to wait for candle close before entering.',
    screenshot_url: 'https://picsum.photos/seed/' + i + '/800/600',
    whyEntered: 'Saw a clear liquidity sweep and CHoCH on the 15m timeframe.',
    whatHappened: isWin ? 'Price hit my TP exactly as planned.' : 'Price reversed and hit my SL.',
    mistakesMade: isWin ? 'None, followed plan.' : 'Moved SL to breakeven too early.',
    whatWentWell: isWin ? 'Good entry, good risk management.' : 'Kept risk small.',
    emotionBefore: 'confident',
    emotionAfter: isWin ? 'calm' : 'frustrated',
    mistakeTags: isWin ? [] : ['fomo', 'early-entry'],
    positiveTags: isWin ? ['good-setup', 'patient'] : [],
    emotion: isWin ? 'Тайван' : 'Шунал'
  };
});

export const mockAiInsights = {
  summary: "Таны Breakout стратеги сайн үр дүнтэй байна. Энэ долоо хоногт тус стратегиас 75%-ийн хожилтой байлаа. (Mock Data)",
  mistakes: [
    "Баасан гаригт алдагдал хүлээх магадлал өндөр байна. Сүүлийн 3 долоо хоногийн баасан гаригт дараалан алдагдалтай гарсан байна."
  ],
  strengths: [
    "Эрсдэлийн удирдлага сайн байна. Алдагдалтай арилжаанууд төлөвлөсөн хэмжээнээс хэтрээгүй байна.",
    "Тренд дагасан арилжаанууд өндөр хожилтой байна."
  ],
  advice: "Ирэх долоо хоногт өдрийн эхний 1 цагт арилжаа хийхээс зайлсхийгээд үзээрэй. Энэ үед таны алдагдал хамгийн их байна."
};
