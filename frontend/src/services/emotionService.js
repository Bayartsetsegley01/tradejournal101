const API_BASE_URL = '/api';

export const emotionService = {
  getEmotions: async () => {
    const res = await fetch(`${API_BASE_URL}/emotions`);
    return res.json();
  },
  
  createEmotion: async (emotionData) => {
    const res = await fetch(`${API_BASE_URL}/emotions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emotionData)
    });
    return res.json();
  }
};
