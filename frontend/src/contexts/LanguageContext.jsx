import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext(null);

export const translations = {
  mn: {
    // Nav
    analytics: "Анализ",
    journal: "Тэмдэглэл",
    mistakes: "Алдаа & Сэтгэл зүй",
    aiAdvisor: "AI Зөвлөх",
    weeklyReview: "Долоо хоногийн дүгнэлт",
    settings: "Тохиргоо",
    // Journal
    newTrade: "Шинэ арилжаа",
    editTrade: "Арилжаа засах",
    import: "Импорт",
    export: "Экспорт",
    save: "Хадгалах",
    cancel: "Цуцлах",
    delete: "Устгах",
    saveDraft: "Ноорог хадгалах",
    // Trade form tabs
    setupMarket: "Setup & Market",
    executionRisk: "Execution & Risk",
    psychologyTags: "Psychology & Tags",
    journalMedia: "Тэмдэглэл & Медиа",
    // Trade form fields
    date: "Огноо",
    status: "Төлөв",
    market: "Зах зээл",
    symbol: "Symbol",
    direction: "Чиглэл",
    session: "Сесс",
    entryPrice: "Оролтын үнэ",
    exitPrice: "Гаралтын үнэ",
    stopLoss: "Stop Loss",
    takeProfit: "Take Profit",
    quantity: "Тоо хэмжээ / Lot",
    riskPercent: "Эрсдэл %",
    strategy: "Стратеги",
    rr: "Risk/Reward (R/R)",
    pnl: "Est. P&L",
    // Psychology
    emotionBefore: "Арилжааны өмнөх сэтгэл зүй",
    emotionAfter: "Арилжааны дараах сэтгэл зүй",
    positiveTags: "Эерэг тэмдэглэгээ",
    mistakeTags: "Алдааны тэмдэглэгээ",
    addCustom: "+ Шинэ нэмэх",
    // Journal fields
    setupDesc: "Тохиргооны тайлбар",
    whyEntered: "Яагаад орсон бэ?",
    whatHappened: "Юу болсон бэ?",
    whatWentWell: "Юуг сайн хийсэн бэ?",
    mistakesMade: "Ямар алдаа гаргасан бэ?",
    lessonLearned: "Юу сурсан бэ?",
    screenshot: "Screenshot (Зураг)",
    uploadImage: "Зураг оруулах эсвэл Drag & Drop",
    // Table headers
    date_col: "Огноо",
    marketSymbol: "Market & Symbol",
    ls: "L/S",
    entry: "Оролт",
    exit: "Гаралт",
    status_col: "Төлөв",
    psychology: "Сэтгэл зүй",
    media: "Медиа",
    actions: "Үйлдэл",
    // Status
    closed: "Хаагдсан",
    open: "Нээлттэй",
    planned: "Төлөвлөсөн",
    draft: "Ноорог",
    // Misc
    noData: "Мэдээлэл олдсонгүй",
    loading: "Уншиж байна...",
    aiAnalyzing: "AI анализ хийж байна...",
    askAI: "Арилжааны талаар асуу...",
    send: "Илгээх",
    // Weekly review
    weeklyTitle: "Долоо хоногийн дүгнэлт",
    monthlyTitle: "Сарын дүгнэлт",
    totalTrades: "Нийт арилжаа",
    winRate: "Win Rate",
    netPnl: "Нийт PnL",
    profitFactor: "Profit Factor",
    avgWin: "Дундаж ашиг",
    avgLoss: "Дундаж алдагдал",
    avgRR: "Дундаж RR",
    bestTrade: "Хамгийн сайн арилжаа",
    worstTrade: "Хамгийн муу арилжаа",
    topMistakes: "Давтагдсан алдаанууд",
    topPositive: "Давуу талууд",
    emotionEffect: "Сэтгэл зүйн нөлөөлөл",
    dailyBreakdown: "Өдрийн задаргаа",
    noTradesInPeriod: "Энэ хугацаанд арилжаа байхгүй байна.",
    // Mistakes page
    topMistakesTitle: "Хамгийн их гаргасан алдаанууд",
    positiveTagsTitle: "Давуу талууд (Positive Tags)",
    emotionStats: "Сэтгэл зүйн нөлөөлөл",
    noMistakes: "Алдааны tag бүртгэгдээгүй байна.",
    noPositive: "Positive tag бүртгэгдээгүй байна.",
    noEmotions: "Сэтгэл зүйн tag бүртгэгдээгүй байна.",
    // AI
    aiTitle: "AI Зөвлөх",
    aiDesc: "Таны арилжааны түүхэнд суурилсан хувийн зөвлөмжүүд болон чат",
    overallSummary: "Ерөнхий дүгнэлт",
    mistakes_ai: "Алдаанууд",
    strengths: "Давуу талууд",
    nextStep: "Дараагийн алхам",
    aiChat: "AI Чат",
  },
  en: {
    analytics: "Analytics",
    journal: "Journal",
    mistakes: "Mistakes & Psychology",
    aiAdvisor: "AI Advisor",
    weeklyReview: "Weekly Review",
    settings: "Settings",
    newTrade: "New Trade",
    editTrade: "Edit Trade",
    import: "Import",
    export: "Export",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    saveDraft: "Save Draft",
    setupMarket: "Setup & Market",
    executionRisk: "Execution & Risk",
    psychologyTags: "Psychology & Tags",
    journalMedia: "Journal & Media",
    date: "Date",
    status: "Status",
    market: "Market",
    symbol: "Symbol",
    direction: "Direction",
    session: "Session",
    entryPrice: "Entry Price",
    exitPrice: "Exit Price",
    stopLoss: "Stop Loss",
    takeProfit: "Take Profit",
    quantity: "Quantity / Lot Size",
    riskPercent: "Risk %",
    strategy: "Strategy",
    rr: "Risk/Reward (R/R)",
    pnl: "Est. P&L",
    emotionBefore: "Emotion Before Trade",
    emotionAfter: "Emotion After Trade",
    positiveTags: "Positive Tags",
    mistakeTags: "Mistake Tags",
    addCustom: "+ Add Custom",
    setupDesc: "Setup Description",
    whyEntered: "Why did you enter?",
    whatHappened: "What happened?",
    whatWentWell: "What went well?",
    mistakesMade: "What mistakes did you make?",
    lessonLearned: "Lesson Learned",
    screenshot: "Screenshot",
    uploadImage: "Upload image or Drag & Drop",
    date_col: "Date",
    marketSymbol: "Market & Symbol",
    ls: "L/S",
    entry: "Entry",
    exit: "Exit",
    status_col: "Status",
    psychology: "Psychology",
    media: "Media",
    actions: "Actions",
    closed: "Closed",
    open: "Open",
    planned: "Planned",
    draft: "Draft",
    noData: "No data found",
    loading: "Loading...",
    aiAnalyzing: "AI is analyzing...",
    askAI: "Ask about your trades...",
    send: "Send",
    weeklyTitle: "Weekly Review",
    monthlyTitle: "Monthly Review",
    totalTrades: "Total Trades",
    winRate: "Win Rate",
    netPnl: "Net PnL",
    profitFactor: "Profit Factor",
    avgWin: "Avg Win",
    avgLoss: "Avg Loss",
    avgRR: "Avg RR",
    bestTrade: "Best Trade",
    worstTrade: "Worst Trade",
    topMistakes: "Top Mistakes",
    topPositive: "Positive Patterns",
    emotionEffect: "Emotion Impact",
    dailyBreakdown: "Daily Breakdown",
    noTradesInPeriod: "No trades in this period.",
    topMistakesTitle: "Most Common Mistakes",
    positiveTagsTitle: "Positive Tags",
    emotionStats: "Emotion Impact",
    noMistakes: "No mistake tags recorded.",
    noPositive: "No positive tags recorded.",
    noEmotions: "No emotion tags recorded.",
    aiTitle: "AI Advisor",
    aiDesc: "Personalized insights and chat based on your trading history",
    overallSummary: "Overall Summary",
    mistakes_ai: "Mistakes",
    strengths: "Strengths",
    nextStep: "Next Step",
    aiChat: "AI Chat",
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem('app_preferences') || '{}');
      return prefs.language || 'mn';
    } catch { return 'mn'; }
  });

  useEffect(() => {
    const handler = () => {
      try {
        const prefs = JSON.parse(localStorage.getItem('app_preferences') || '{}');
        setLang(prefs.language || 'mn');
      } catch {}
    };
    window.addEventListener('language-changed', handler);
    return () => window.removeEventListener('language-changed', handler);
  }, []);

  const t = (key) => translations[lang]?.[key] || translations['mn']?.[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
