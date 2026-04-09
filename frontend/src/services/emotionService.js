const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';
const getHeaders = () => {
  const token = localStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

export const emotionService = {
  getEmotions: async () => { const r = await fetch(`${API_BASE_URL}/emotions`, { headers: getHeaders(), credentials: 'include' }); return r.json(); },
  createEmotion: async (d) => { const r = await fetch(`${API_BASE_URL}/emotions`, { method:'POST', headers: getHeaders(), credentials:'include', body: JSON.stringify(d) }); return r.json(); }
};
