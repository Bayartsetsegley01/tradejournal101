const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';

export const tagService = {
  getTags: async () => {
    const res = await fetch(`${API_BASE_URL}/tags`);
    return res.json();
  },
  
  createTag: async (tagData) => {
    const res = await fetch(`${API_BASE_URL}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tagData)
    });
    return res.json();
  }
};
