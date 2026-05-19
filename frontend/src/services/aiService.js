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

  sendChat: (message, history = [], mode = 'analysis') =>
    safeFetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, history, mode }),
    }),

  sessions: {
    list:        ()             => safeFetch(`${API_BASE_URL}/ai/sessions`),
    create:      (title)        => safeFetch(`${API_BASE_URL}/ai/sessions`, { method: 'POST', body: JSON.stringify({ title }) }),
    getMessages: (id)           => safeFetch(`${API_BASE_URL}/ai/sessions/${id}/messages`),
    delete:      (id)           => safeFetch(`${API_BASE_URL}/ai/sessions/${id}`, { method: 'DELETE' }),
    saveMessage: (id, role, content) => safeFetch(`${API_BASE_URL}/ai/sessions/${id}/messages`, { method: 'POST', body: JSON.stringify({ role, content }) }),
    updateTitle: (id, title)    => safeFetch(`${API_BASE_URL}/ai/sessions/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
  },
};
