import { query, getDbStatus } from '../db/index.js';

// Mock data for tags
export const mockTags = [
  { id: 'custom-emotion-1', type: 'emotion', label: 'Overconfident', emoji: '😎', color: 'blue' },
  { id: 'custom-mistake-1', type: 'mistake', label: 'Revenge Trading', color: 'rose' }
];

export const getTags = async (req, res) => {
  try {
    if (!getDbStatus()) throw new Error("DB_NOT_CONNECTED");
    const result = await query('SELECT * FROM tags');
    res.json({ success: true, data: result.rows, mode: 'database' });
  } catch (error) {
    res.json({ success: true, data: mockTags, mode: 'mock' });
  }
};

export const createTag = async (req, res) => {
  try {
    const { name, type, color, emoji } = req.body;
    
    if (!getDbStatus()) throw new Error("DB_NOT_CONNECTED");
    
    const dbQuery = `
      INSERT INTO tags (name, type, color) 
      VALUES ($1, $2, $3) RETURNING *
    `;
    
    const result = await query(dbQuery, [name || req.body.label, type, color]);
    res.status(201).json({ success: true, data: result.rows[0], mode: 'database' });
  } catch (error) {
    const newTag = {
      id: `custom-${req.body.type}-${Date.now()}`,
      ...req.body,
      is_custom: true,
      mode: 'mock'
    };
    mockTags.push(newTag);
    res.status(201).json({ success: true, data: newTag, mode: 'mock' });
  }
};
