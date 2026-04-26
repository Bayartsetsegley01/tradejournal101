const API = (import.meta.env.VITE_API_URL || '') + '/api';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const getDashboardStats = () =>
  fetch(`${API}/admin/dashboard`, { headers: authHeaders(), credentials: 'include' }).then(handle);

export const getUsers = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${API}/admin/users?${q}`, { headers: authHeaders(), credentials: 'include' }).then(handle);
};

export const updateUserStatus = (id, is_active) =>
  fetch(`${API}/admin/users/${id}/status`, {
    method: 'PATCH', headers: authHeaders(), credentials: 'include',
    body: JSON.stringify({ is_active }),
  }).then(handle);

export const deleteUser = (id) =>
  fetch(`${API}/admin/users/${id}`, { method: 'DELETE', headers: authHeaders(), credentials: 'include' }).then(handle);

export const getFeedback = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${API}/admin/feedback?${q}`, { headers: authHeaders(), credentials: 'include' }).then(handle);
};

export const updateFeedbackStatus = (id, status) =>
  fetch(`${API}/admin/feedback/${id}/status`, {
    method: 'PATCH', headers: authHeaders(), credentials: 'include',
    body: JSON.stringify({ status }),
  }).then(handle);

export const deleteFeedback = (id) =>
  fetch(`${API}/admin/feedback/${id}`, { method: 'DELETE', headers: authHeaders(), credentials: 'include' }).then(handle);

export const getConfig = () =>
  fetch(`${API}/admin/config`, { headers: authHeaders(), credentials: 'include' }).then(handle);

export const updateConfig = (key, value) =>
  fetch(`${API}/admin/config`, {
    method: 'PUT', headers: authHeaders(), credentials: 'include',
    body: JSON.stringify({ key, value }),
  }).then(handle);

export const submitFeedback = (type, message) =>
  fetch(`${API}/feedback`, {
    method: 'POST',
    headers: authHeaders(),
    credentials: 'include',
    body: JSON.stringify({ type, message }),
  }).then(handle);
