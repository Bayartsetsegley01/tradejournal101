const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';
const getHeaders = () => {
  const token = localStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

export const tradeService = {
  getTrades: async () => { const r = await fetch(`${API_BASE_URL}/trades`, { headers: getHeaders(), credentials: 'include' }); return r.json(); },
  getTradeById: async (id) => { const r = await fetch(`${API_BASE_URL}/trades/${id}`, { headers: getHeaders(), credentials: 'include' }); return r.json(); },
  createTrade: async (d) => { const r = await fetch(`${API_BASE_URL}/trades`, { method:'POST', headers: getHeaders(), credentials:'include', body: JSON.stringify(d) }); const data = await r.json(); if (!data.success) throw new Error(data.error||'Failed'); return data; },
  updateTrade: async (id, d) => { const r = await fetch(`${API_BASE_URL}/trades/${id}`, { method:'PATCH', headers: getHeaders(), credentials:'include', body: JSON.stringify(d) }); const data = await r.json(); if (!data.success) throw new Error(data.error||'Failed'); return data; },
  deleteTrade: async (id) => { const r = await fetch(`${API_BASE_URL}/trades/${id}`, { method:'DELETE', headers: getHeaders(), credentials:'include' }); return r.json(); },
  updateNotes: async (id, d) => { const r = await fetch(`${API_BASE_URL}/trades/${id}/notes`, { method:'PATCH', headers: getHeaders(), credentials:'include', body: JSON.stringify(d) }); return r.json(); },
  addMedia: async (id, d) => { const r = await fetch(`${API_BASE_URL}/trades/${id}/media`, { method:'POST', headers: getHeaders(), credentials:'include', body: JSON.stringify(d) }); return r.json(); }
};
