import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Zap, Monitor, FileSpreadsheet, ArrowLeft, Eye, EyeOff, RefreshCw, CheckCircle2 } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

// ── Badge ────────────────────────────────────────────────────────────────────

function Badge({ verified }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 tracking-wide">
      ✓ Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/40 tracking-wide">
      Unverified
    </span>
  );
}

// ── Method card ──────────────────────────────────────────────────────────────

function MethodCard({ icon: Icon, iconColor, title, description, badge, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group
        ${hovered
          ? 'bg-slate-800/60 border-accent/40 shadow-[0_0_20px_rgba(200,240,122,0.06)]'
          : 'bg-slate-800/30 border-slate-700/50'
        }`}
    >
      <div className="flex items-start gap-4">
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200
          ${hovered ? 'bg-accent/15' : 'bg-slate-700/50'}`}>
          <Icon className={`w-5 h-5 transition-colors duration-200 ${hovered ? iconColor : 'text-slate-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white">{title}</span>
            <Badge verified={badge === 'verified'} />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
        </div>
        <div className={`shrink-0 self-center transition-transform duration-200 ${hovered ? 'translate-x-0.5' : ''}`}>
          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}

// ── AutoSync form screen ─────────────────────────────────────────────────────

function AutoSyncScreen({ onBack, onClose }) {
  const [form, setForm] = useState({ login: '', password: '', server: '' });
  const [showPass, setShowPass] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const connect = async () => {
    setConnecting(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/mt5/connect`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (d.success) {
        setSuccess(true);
        setTimeout(onClose, 2200);
      } else {
        setError(d.error || 'Холбоход алдаа гарлаа');
      }
    } catch (e) {
      setError(e.message);
    }
    setConnecting(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <p className="text-white font-semibold text-lg">Амжилттай холбогдлоо!</p>
          <p className="text-slate-400 text-sm mt-1">Арилжааны түүхийг татаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
          <Zap className="w-4 h-4 text-accent" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white leading-tight">Auto-Sync</h3>
          <p className="text-xs text-slate-500">Read-only горим — арилжаа нээх боломжгүй</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">MT5 Login (дансны дугаар)</label>
          <input
            type="text"
            value={form.login}
            onChange={e => setForm({ ...form, login: e.target.value })}
            placeholder="12345678"
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Investor Password</label>
          <div className="flex items-center gap-2">
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
            />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-700">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Server</label>
          <input
            type="text"
            value={form.server}
            onChange={e => setForm({ ...form, server: e.target.value })}
            placeholder="MetaQuotes-Demo"
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={connect}
        disabled={connecting || !form.login || !form.password || !form.server}
        className="mt-5 w-full flex items-center justify-center gap-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-slate-950 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(200,240,122,0.15)]"
      >
        <RefreshCw className={`w-4 h-4 ${connecting ? 'animate-spin' : ''}`} />
        {connecting ? 'Холбогдож байна... (30-60с)' : 'MT5 Холбох'}
      </button>
    </>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function ImportMethodModal({ isOpen, onClose, onCSVImport }) {
  const navigate = useNavigate();
  const [screen, setScreen] = useState('select');

  const handleClose = () => {
    setScreen('select');
    onClose();
  };

  const handleEASync = () => {
    handleClose();
    navigate('/settings', { state: { activeTab: 'mt5' } });
  };

  const handleCSV = () => {
    handleClose();
    onCSVImport();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-accent/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative p-6">
          {screen === 'select' ? (
            <>
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Импортын арга сонгох</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Арилжааны түүхийг хэрхэн оруулах вэ?</p>
                </div>
                <button onClick={handleClose}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors -mt-0.5">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cards */}
              <div className="space-y-2.5">
                <MethodCard
                  icon={Zap}
                  iconColor="text-accent"
                  title="Auto-Sync"
                  badge="verified"
                  description="MT5 login, investor password, server оруулна. Бид read-only горимоор холбогдож trade history автоматаар татна."
                  onClick={() => setScreen('autosync')}
                />
                <MethodCard
                  icon={Monitor}
                  iconColor="text-blue-400"
                  title="EA Sync"
                  badge="verified"
                  description="MT5 дотроо EA суулгана. Trade хаагдах бүрт автоматаар илгээгддэг. Компьютер асаатай үед л ажилладаг."
                  onClick={handleEASync}
                />
                <MethodCard
                  icon={FileSpreadsheet}
                  iconColor="text-slate-300"
                  title="CSV Import"
                  badge="unverified"
                  description="MT5-аас CSV export хийж upload хийнэ. Ямар ч холболт шаардахгүй."
                  onClick={handleCSV}
                />
              </div>
            </>
          ) : (
            <AutoSyncScreen
              onBack={() => setScreen('select')}
              onClose={handleClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
