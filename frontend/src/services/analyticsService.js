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
    if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
    return await r.json();
  } catch (e) { console.error(`Fetch error for ${url}:`, e); return { success: false, error: e.message }; }
};

export const analyticsService = {
  getSummary: async (range = '7d', accountId) => {
    const p = new URLSearchParams({ range });
    if (accountId && accountId !== 'all') p.set('account_id', accountId);
    return safeFetch(`${API_BASE_URL}/analytics/summary?${p}`);
  },
  getCharts: async (range = '7d', accountId) => {
    const p = new URLSearchParams({ range });
    if (accountId && accountId !== 'all') p.set('account_id', accountId);
    return safeFetch(`${API_BASE_URL}/analytics/charts?${p}`);
  },
  getMistakes: async (range = '7d', accountId) => {
    const p = new URLSearchParams({ range });
    if (accountId && accountId !== 'all') p.set('account_id', accountId);
    return safeFetch(`${API_BASE_URL}/analytics/mistakes?${p}`);
  },
  getPerformance: async (range = '7d', accountId) => {
    const p = new URLSearchParams({ range });
    if (accountId && accountId !== 'all') p.set('account_id', accountId);
    return safeFetch(`${API_BASE_URL}/analytics/performance?${p}`);
  },
getWeeklyReview: async (start, end) => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    return safeFetch(`${API_BASE_URL}/analytics/weekly-review?${params}`);
  },
  getMonthlyReview: async (year, month) => {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    return safeFetch(`${API_BASE_URL}/analytics/monthly-review?${params}`);
  },
  getAiInsights: async (trades = []) => safeFetch(`${API_BASE_URL}/ai/insights`, {
    method: 'POST',
    body: JSON.stringify(trades),
  }),
};
