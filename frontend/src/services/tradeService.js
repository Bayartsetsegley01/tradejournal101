const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';
const getHeaders = () => {
  const token = localStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

// Normalize DB trade object → UI-friendly camelCase
const normalizeTrade = (t) => {
  if (!t) return t;
  const parseTags = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };
  return {
    ...t,
    // market
    market: t.market_type || t.market || 'forex',
    // prices
    entry: t.entry_price ?? t.entry ?? '',
    exit: t.exit_price ?? t.exit ?? '',
    stopLoss: t.stop_loss ?? t.stopLoss ?? '',
    takeProfit: t.take_profit ?? t.takeProfit ?? '',
    quantity: t.position_size ?? t.quantity ?? '',
    // psychology
    emotionBefore: t.emotion_before || t.emotionBefore || '',
    emotionAfter: t.emotion_after || t.emotionAfter || '',
    positiveTags: parseTags(t.positive_tags ?? t.positiveTags),
    mistakeTags: parseTags(t.mistake_tags ?? t.mistakeTags),
    // journal
    whyEntered: t.why_entered || t.whyEntered || '',
    whatHappened: t.what_happened || t.whatHappened || '',
    whatWentWell: t.what_went_well || t.whatWentWell || '',
    mistakesMade: t.mistakes_made || t.mistakesMade || '',
    setupDescription: t.setup_description || t.setupDescription || '',
    lessonLearned: t.lessons_learned || t.lessonLearned || '',
  };
};

export const tradeService = {
  getTrades: async () => {
    const r = await fetch(`${API_BASE_URL}/trades`, { headers: getHeaders(), credentials: 'include' });
    const data = await r.json();
    if (data.success && Array.isArray(data.data)) {
      data.data = data.data.map(normalizeTrade);
    }
    return data;
  },
  getTradeById: async (id) => {
    const r = await fetch(`${API_BASE_URL}/trades/${id}`, { headers: getHeaders(), credentials: 'include' });
    const data = await r.json();
    if (data.success && data.data) data.data = normalizeTrade(data.data);
    return data;
  },
  createTrade: async (d) => {
    const r = await fetch(`${API_BASE_URL}/trades`, {
      method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify(d)
    });
    const data = await r.json();
    if (!data.success) throw new Error(data.error || 'Failed');
    if (data.data) data.data = normalizeTrade(data.data);
    return data;
  },
  updateTrade: async (id, d) => {
    const r = await fetch(`${API_BASE_URL}/trades/${id}`, {
      method: 'PATCH', headers: getHeaders(), credentials: 'include', body: JSON.stringify(d)
    });
    const data = await r.json();
    if (!data.success) throw new Error(data.error || 'Failed');
    if (data.data) data.data = normalizeTrade(data.data);
    return data;
  },
  deleteTrade: async (id) => {
    const r = await fetch(`${API_BASE_URL}/trades/${id}`, {
      method: 'DELETE', headers: getHeaders(), credentials: 'include'
    });
    return r.json();
  },
  updateNotes: async (id, d) => {
    const r = await fetch(`${API_BASE_URL}/trades/${id}/notes`, {
      method: 'PATCH', headers: getHeaders(), credentials: 'include', body: JSON.stringify(d)
    });
    return r.json();
  },
  addMedia: async (id, d) => {
    const r = await fetch(`${API_BASE_URL}/trades/${id}/media`, {
      method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify(d)
    });
    return r.json();
  }
};
