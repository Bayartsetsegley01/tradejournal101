const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

const safeFetch = async (url, options = {}) => {
  try {
    const r = await fetch(url, { ...options, headers: getHeaders(), credentials: 'include' });
    const data = await r.json();
    // Pass through JSON body even on error so callers can inspect `code`
    return r.ok ? data : { ...data, httpStatus: r.status };
  } catch (e) {
    console.error(`Fetch error for ${url}:`, e);
    return { success: false, error: e.message };
  }
};

export const aiService = {
  getInsights: (trades = []) =>
    safeFetch(`${API_BASE_URL}/ai/insights`, {
      method: 'POST',
      body: JSON.stringify(trades),
    }),

  sendChat: (message, history = []) =>
    safeFetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
};
