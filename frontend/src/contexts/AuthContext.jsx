import React, { createContext, useState, useEffect, useContext } from 'react';

const API = (import.meta.env.VITE_API_URL || '') + '/api';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const authFetch = (url, opts = {}) =>
    fetch(url, {
      ...opts,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...opts.headers, ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) },
    });

  const checkAuth = async () => {
    // Pick up token from URL params after Google OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      localStorage.setItem('token', urlToken);
      window.history.replaceState({}, '', window.location.pathname);
    }

    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const r = await authFetch(`${API}/auth/me`);
      if (r.ok) { const d = await r.json(); setUser(d.user); }
      else { setUser(null); localStorage.removeItem('token'); }
    } catch { setUser(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { checkAuth(); }, []);

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const r = await authFetch(`${API}/auth/me`);
    if (r.ok) { const d = await r.json(); setUser(d.user); }
  };

  const login = async (email, password) => {
    const r = await authFetch(`${API}/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) });
    const data = await r.json();
    if (!r.ok) throw Object.assign(new Error(data.error || 'Login failed'), { requiresVerification: data.requiresVerification, email: data.email });
    if (data.token) localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const r = await authFetch(`${API}/auth/register`, { method: 'POST', body: JSON.stringify({ name, email, password }) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Registration failed');
    return data; // { requiresVerification: true, email }
  };

  const verifyEmail = async (email, code) => {
    const r = await authFetch(`${API}/auth/verify-email`, { method: 'POST', body: JSON.stringify({ email, code }) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Verification failed');
    if (data.token) localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const resendVerification = async (email) => {
    const r = await authFetch(`${API}/auth/resend-verification`, { method: 'POST', body: JSON.stringify({ email }) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Failed');
    return data;
  };

  const googleLogin = async ({ googleId, email, name, picture }) => {
    const r = await authFetch(`${API}/auth/google`, { method: 'POST', body: JSON.stringify({ googleId, email, name, picture }) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Google нэвтрэлт амжилтгүй боллоо.');
    if (data.token) localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const sendCode = async (contact, method) => {
    const r = await authFetch(`${API}/auth/send-code`, { method: 'POST', body: JSON.stringify({ contact, method }) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Failed to send code');
    return data;
  };

  const verifyCode = async (contact, code) => {
    const r = await authFetch(`${API}/auth/verify-code`, { method: 'POST', body: JSON.stringify({ contact, code }) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Verification failed');
    if (data.token) localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { await authFetch(`${API}/auth/logout`, { method: 'POST' }); } catch {}
    finally { localStorage.removeItem('token'); setUser(null); }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, resendVerification, googleLogin, sendCode, verifyCode, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
