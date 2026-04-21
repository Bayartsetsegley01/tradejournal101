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
  getSummary: async (range = '7d') => safeFetch(`${API_BASE_URL}/analytics/summary?range=${range}`),
  getCharts: async (range = '7d') => safeFetch(`${API_BASE_URL}/analytics/charts?range=${range}`),
  getMistakes: async (range = '7d') => safeFetch(`${API_BASE_URL}/analytics/mistakes?range=${range}`),
  getPerformance: async (range = '7d') => safeFetch(`${API_BASE_URL}/analytics/performance?range=${range}`),
  getAiInsights: async () => safeFetch(`${API_BASE_URL}/ai/insights`, { method: 'POST', body: JSON.stringify({}) }),
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
};
