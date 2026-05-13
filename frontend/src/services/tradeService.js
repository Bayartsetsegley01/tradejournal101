const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';
const getHeaders = () => {
  const token = localStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

// DB-аас ирсэн snake_case-г frontend camelCase болгох
const normalizeTrade = (t) => {
  if (!t) return t;
  return {
    ...t,
    // Emotion fields
    emotionBefore: t.emotionBefore || t.emotion_before || '',
    emotionAfter:  t.emotionAfter  || t.emotion_after  || '',
    // Tag fields — JSONB string байж болно
    positiveTags: Array.isArray(t.positiveTags) ? t.positiveTags :
                  Array.isArray(t.positive_tags) ? t.positive_tags :
                  (typeof t.positive_tags === 'string' ? JSON.parse(t.positive_tags || '[]') : []),
    mistakeTags:  Array.isArray(t.mistakeTags) ? t.mistakeTags :
                  Array.isArray(t.mistake_tags) ? t.mistake_tags :
                  (typeof t.mistake_tags === 'string' ? JSON.parse(t.mistake_tags || '[]') : []),
    // Note fields
    whyEntered:   t.whyEntered   || t.why_entered   || '',
    whatHappened: t.whatHappened || t.what_happened || '',
    whatWentWell: t.whatWentWell || t.what_went_well || '',
    mistakesMade: t.mistakesMade || t.mistakes_made  || '',
    lessonLearned: t.lessonLearned || t.lessons_learned || '',
    setupDescription: t.setupDescription || t.setup_description || '',
    // Media
    screenshot_url: t.screenshot_url || null,
    mediaUrls: Array.isArray(t.mediaUrls) ? t.mediaUrls :
               Array.isArray(t.media_urls) ? t.media_urls : [],
    // Price fields
    entry_price: t.entry_price || t.entry || null,
    exit_price:  t.exit_price  || t.exit  || null,
    pnl: parseFloat(t.pnl || 0),
    rr_ratio: t.rr_ratio || t.rr || null,
  };
};

export const tradeService = {
  getTrades: async () => {
    const r = await fetch(`${API_BASE_URL}/trades`, { headers: getHeaders(), credentials: 'include' });
    const data = await r.json();
    if (data.data) data.data = data.data.map(normalizeTrade);
    return data;
  },
  getTradeById: async (id) => {
    const r = await fetch(`${API_BASE_URL}/trades/${id}`, { headers: getHeaders(), credentials: 'include' });
    const data = await r.json();
    if (data.data) data.data = normalizeTrade(data.data);
    return data;
  },
  createTrade: async (d) => {
    const r = await fetch(`${API_BASE_URL}/trades`, { method:'POST', headers: getHeaders(), credentials:'include', body: JSON.stringify(d) });
    const data = await r.json();
    if (!data.success) throw new Error(data.error||'Failed');
    if (data.data) data.data = normalizeTrade(data.data);
    return data;
  },
  updateTrade: async (id, d) => {
    const r = await fetch(`${API_BASE_URL}/trades/${id}`, { method:'PATCH', headers: getHeaders(), credentials:'include', body: JSON.stringify(d) });
    const data = await r.json();
    if (!data.success) throw new Error(data.error||'Failed');
    if (data.data) data.data = normalizeTrade(data.data);
    return data;
  },
  deleteTrade: async (id) => {
    const r = await fetch(`${API_BASE_URL}/trades/${id}`, { method:'DELETE', headers: getHeaders(), credentials:'include' });
    return r.json();
  },
  updateNotes: async (id, d) => {
    const r = await fetch(`${API_BASE_URL}/trades/${id}/notes`, { method:'PATCH', headers: getHeaders(), credentials:'include', body: JSON.stringify(d) });
    return r.json();
  },
  uploadMedia: async (id, file) => {
    const fd = new FormData();
    fd.append('image', file);
    const token = localStorage.getItem('token');
    const r = await fetch(`${API_BASE_URL}/trades/${id}/media`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      credentials: 'include',
      body: fd,
    });
    const data = await r.json();
    if (!data.success) throw new Error(data.error || 'Upload failed');
    return data;
  },
  removeMedia: async (id, url) => {
    const r = await fetch(`${API_BASE_URL}/trades/${id}/media`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ url }),
    });
    return r.json();
  },
};
