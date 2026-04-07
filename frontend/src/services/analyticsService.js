const API_BASE_URL = '/api';

const safeFetch = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    return { success: false, error: error.message };
  }
};

export const analyticsService = {
  getSummary: async (range = '7d') => {
    return safeFetch(`${API_BASE_URL}/analytics/summary?range=${range}`);
  },
  
  getCharts: async (range = '7d') => {
    return safeFetch(`${API_BASE_URL}/analytics/charts?range=${range}`);
  },
  
  getMistakes: async (range = '7d') => {
    return safeFetch(`${API_BASE_URL}/analytics/mistakes?range=${range}`);
  },
  
  getAiInsights: async (trades = []) => {
    return safeFetch(`${API_BASE_URL}/ai/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trades)
    });
  }
};
