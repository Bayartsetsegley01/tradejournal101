const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';

export const tradeService = {
  getTrades: async () => {
    const res = await fetch(`${API_BASE_URL}/trades`);
    return res.json();
  },
  
  getTradeById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/trades/${id}`);
    return res.json();
  },
  
  createTrade: async (tradeData) => {
    const res = await fetch(`${API_BASE_URL}/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tradeData)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create trade');
    return data;
  },
  
  updateTrade: async (id, tradeData) => {
    const res = await fetch(`${API_BASE_URL}/trades/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tradeData)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to update trade');
    return data;
  },
  
  deleteTrade: async (id) => {
    const res = await fetch(`${API_BASE_URL}/trades/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },
  
  updateNotes: async (id, notesData) => {
    const res = await fetch(`${API_BASE_URL}/trades/${id}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notesData)
    });
    return res.json();
  },
  
  addMedia: async (id, mediaData) => {
    const res = await fetch(`${API_BASE_URL}/trades/${id}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mediaData)
    });
    return res.json();
  }
};
