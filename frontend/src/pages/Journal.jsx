import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { TradeTable } from "@/components/features/journal/TradeTable";
import { TradeFilters } from "@/components/features/journal/TradeFilters";
import { AddTradeModal } from "@/components/features/journal/AddTradeModal";
import { TradeDetailModal } from "@/components/features/journal/TradeDetailModal";
import { ExportModal } from "@/components/features/journal/ExportModal";
import { ImportModal } from "@/components/features/journal/ImportModal";
import { ImportMethodModal } from "@/components/features/journal/ImportMethodModal";
import { TimeFilter } from "@/components/features/analytics/TimeFilter";
import {
  Plus, Download, Loader2, Upload, ChevronLeft, ChevronRight,
  ArrowLeft, BarChart2, Wallet, TrendingUp, TrendingDown, RefreshCw,
  X, Zap, FileSpreadsheet, Eye, EyeOff, Check,
} from "lucide-react";
import { SESSIONS } from "@/lib/constants";
import { useLang } from "@/contexts/LanguageContext";
import { useTrades } from "@/contexts/TradesContext";
import { tradeService } from "@/services/tradeService";

const PAGE_SIZE = 10;
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

// ── Mini equity sparkline ─────────────────────────────────────────────────────

function MiniChart({ data, positive }) {
  if (!data || data.length < 2) return (
    <div className="h-10 flex items-center">
      <span className="text-[10px] text-slate-700">Хангалттай дата алга</span>
    </div>
  );
  const color = positive ? '#4ade80' : '#f87171';
  const gradId = `eq-${positive ? 'p' : 'n'}`;
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#${gradId})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Portfolio account card ────────────────────────────────────────────────────

const STATUS = {
  CONNECTED:  { dot: 'bg-emerald-400 animate-pulse', text: 'text-emerald-400' },
  CONNECTING: { dot: 'bg-amber-400 animate-pulse',   text: 'text-amber-400' },
  ERROR:      { dot: 'bg-rose-400',                  text: 'text-rose-400' },
};

function AccountCard({ account, stats, onClick }) {
  const pnlPos = stats.totalPnl >= 0;
  const st = STATUS[account.status] || STATUS.ERROR;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 hover:bg-slate-800/50 transition-all duration-200 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white font-mono leading-none">{account.login}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{account.server}</p>
          </div>
        </div>
        {account.status && (
          <span className={`flex items-center gap-1 text-[10px] font-semibold ${st.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {account.status === 'CONNECTED' ? 'Холбогдсон' : account.status === 'CONNECTING' ? 'Холбогдож байна' : 'Алдаа'}
          </span>
        )}
      </div>

      {/* PnL */}
      <div className="flex items-end justify-between">
        <div>
          <p className={`text-xl font-bold tabular-nums ${pnlPos ? 'text-emerald-400' : 'text-rose-400'}`}>
            {pnlPos ? '+' : ''}{stats.totalPnl.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Нийт PnL</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">{stats.winRate}%</p>
          <p className="text-[11px] text-slate-500">Win rate</p>
        </div>
      </div>

      {/* Mini chart */}
      <div className="w-full -mx-1">
        <MiniChart data={stats.equityCurve} positive={pnlPos} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800">
        <span className="text-[11px] text-slate-600">{stats.tradeCount} арилжаа</span>
        <span className="text-[11px] text-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          Харах <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}

function PersonalCard({ stats, onClick }) {
  const pnlPos = stats.totalPnl >= 0;
  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 hover:bg-slate-800/50 transition-all duration-200 flex flex-col gap-3"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-accent" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">Үндсэн данс</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Гараар оруулсан арилжаанууд</p>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className={`text-xl font-bold tabular-nums ${pnlPos ? 'text-emerald-400' : 'text-rose-400'}`}>
            {pnlPos ? '+' : ''}{stats.totalPnl.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Нийт PnL</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">{stats.winRate}%</p>
          <p className="text-[11px] text-slate-500">Win rate</p>
        </div>
      </div>

      <div className="w-full -mx-1">
        <MiniChart data={stats.equityCurve} positive={pnlPos} />
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-800">
        <span className="text-[11px] text-slate-600">{stats.tradeCount} арилжаа</span>
        <span className="text-[11px] text-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          Харах <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}

function AddAccountCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full h-full min-h-[180px] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-slate-400 hover:border-slate-700 transition-all duration-200 p-5"
    >
      <div className="w-10 h-10 rounded-xl border border-dashed border-slate-700 flex items-center justify-center">
        <Plus className="w-5 h-5" />
      </div>
      <p className="text-sm font-medium">Шинэ данс нэмэх</p>
      <p className="text-[11px] text-center">Auto-Sync · CSV · Гараар</p>
    </button>
  );
}

// ── Portfolio view ────────────────────────────────────────────────────────────

function PortfolioView({ accounts, accountsLoading, trades, onSelect, onAddAccount }) {
  const { t } = useLang();

  const getStats = (accountId) => {
    const filtered = trades.filter(t =>
      accountId === 'personal' ? !t.account_id : t.account_id === accountId
    );
    const closed = filtered.filter(t => t.status === 'CLOSED');
    const wins = closed.filter(t => parseFloat(t.pnl) > 0);
    const totalPnl = closed.reduce((s, t) => s + parseFloat(t.pnl || 0), 0);
    const winRate = closed.length > 0 ? Math.round(wins.length / closed.length * 100) : 0;
    const sorted = [...closed].sort((a, b) =>
      new Date(a.exit_date || a.entry_date || 0) - new Date(b.exit_date || b.entry_date || 0)
    );
    let cum = 0;
    const equityCurve = sorted.map(t => ({ v: +(cum += parseFloat(t.pnl || 0)).toFixed(2) }));
    return { tradeCount: closed.length, totalPnl, winRate, equityCurve };
  };

  const personalStats = getStats('personal');
  const totalPnlAll = trades
    .filter(t => t.status === 'CLOSED')
    .reduce((s, t) => s + parseFloat(t.pnl || 0), 0);

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Дансууд</h1>
          <p className="text-sm text-slate-400 mt-1">
            Нийт PnL:&nbsp;
            <span className={`font-semibold ${totalPnlAll >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalPnlAll >= 0 ? '+' : ''}{totalPnlAll.toFixed(2)}
            </span>
          </p>
        </div>
      </div>

      {/* Cards grid */}
      {accountsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-52 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Personal account */}
          <PersonalCard
            stats={personalStats}
            onClick={() => onSelect({ id: 'personal', login: 'Үндсэн данс', server: 'Гараар оруулсан' })}
          />

          {/* MT5 accounts */}
          {accounts.map(acc => (
            <AccountCard
              key={acc.id}
              account={acc}
              stats={getStats(acc.id)}
              onClick={() => onSelect(acc)}
            />
          ))}

          {/* Add account */}
          <AddAccountCard onClick={onAddAccount} />
        </div>
      )}
    </div>
  );
}

// ── Add Account Modal (3-step inline flow) ────────────────────────────────────

const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/10 transition-all';

function AddAccountModal({ isOpen, onClose, onSuccess, onManualTrade }) {
  const [step, setStep] = useState('method'); // method | autosync | done
  const [form, setForm] = useState({ login: '', investorPassword: '', server: '' });
  const [showPass, setShowPass] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setStep('method'); setForm({ login: '', investorPassword: '', server: '' }); setError(''); setConnecting(false); };
  const close = () => { reset(); onClose(); };

  const handleConnect = async () => {
    setError(''); setConnecting(true);
    try {
      const r1 = await fetch(`${API_BASE}/mt5/connect`, {
        method: 'POST', headers: getAuthHeaders(), credentials: 'include',
        body: JSON.stringify(form),
      });
      const d1 = await r1.json();
      if (!d1.success) {
        setError(d1.error === 'AUTO_SYNC_UNAVAILABLE'
          ? 'Таны broker Auto-Sync-г дэмжихгүй байна. CSV Import эсвэл Гараар аргыг ашиглана уу.'
          : (d1.error || 'Холбоход алдаа гарлаа'));
        setConnecting(false); return;
      }
      const r2 = await fetch(`${API_BASE}/mt5/sync/${d1.data.id}`, {
        method: 'POST', headers: getAuthHeaders(), credentials: 'include',
        body: JSON.stringify({ months: 3 }),
      });
      await r2.json();
      setStep('done');
      setTimeout(() => { onSuccess(); close(); }, 2000);
    } catch (e) { setError(e.message); setConnecting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Шинэ данс нэмэх</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 'method' ? 'Аргаа сонгоно уу' : step === 'autosync' ? 'MT5 мэдээлэл оруулна уу' : 'Холбогдлоо!'}
            </p>
          </div>
          <button onClick={close} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Step 1: Method selection */}
          {step === 'method' && (
            <div className="space-y-2">
              {/* Auto-Sync */}
              <button onClick={() => setStep('autosync')}
                className="group w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-700 transition-all">
                <div className="flex items-start gap-3.5">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Zap className="w-[18px] h-[18px] text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">Auto-Sync</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">Санал болгох</span>
                    </div>
                    <p className="text-xs text-slate-500">MT5 login болон investor password оруулна. Cloud-оор read-only горимоор арилжааны түүх татна.</p>
                  </div>
                  <svg className="shrink-0 self-center w-4 h-4 text-slate-700 group-hover:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* CSV Import */}
              <button onClick={() => { close(); onSuccess('csv'); }}
                className="group w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-700 transition-all">
                <div className="flex items-start gap-3.5">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-slate-700/50 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-[18px] h-[18px] text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">CSV Import</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/40">Гараар</span>
                    </div>
                    <p className="text-xs text-slate-500">MT5-аас CSV export хийж upload хийнэ. Ямар ч холболт шаардахгүй.</p>
                  </div>
                  <svg className="shrink-0 self-center w-4 h-4 text-slate-700 group-hover:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Manual */}
              <button onClick={() => { close(); onManualTrade(); }}
                className="group w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-700 transition-all">
                <div className="flex items-start gap-3.5">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-slate-700/50 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Plus className="w-[18px] h-[18px] text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">Гараар оруулах</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/40">Үндсэн данс</span>
                    </div>
                    <p className="text-xs text-slate-500">Арилжаа тус бүрийг гараар нэмнэ. Үндсэн данс руу орно.</p>
                  </div>
                  <svg className="shrink-0 self-center w-4 h-4 text-slate-700 group-hover:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          )}

          {/* Step 2: Auto-Sync form */}
          {step === 'autosync' && (
            <div className="space-y-3">
              <button onClick={() => { setStep('method'); setError(''); }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Буцах
              </button>

              {connecting && (
                <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg">
                  <RefreshCw className="w-3.5 h-3.5 text-accent animate-spin shrink-0" />
                  <p className="text-xs text-slate-400">MetaApi-т холбогдож байна... (30–60с)</p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5">MT5 Login</label>
                <input type="text" autoComplete="off" value={form.login}
                  onChange={e => setForm({...form, login: e.target.value})}
                  placeholder="Дансны дугаар (жш: 107057802)"
                  disabled={connecting} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Investor Password</label>
                <div className="flex gap-2">
                  <input type={showPass ? 'text' : 'password'} autoComplete="new-password"
                    value={form.investorPassword}
                    onChange={e => setForm({...form, investorPassword: e.target.value})}
                    placeholder="••••••••" disabled={connecting} className={`${inputCls} flex-1`} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-white transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Server</label>
                <input type="text" autoComplete="off" value={form.server}
                  onChange={e => setForm({...form, server: e.target.value})}
                  placeholder="MetaQuotes-Demo" disabled={connecting} className={inputCls} />
              </div>

              {error && (
                <p className="text-xs text-rose-400 bg-rose-400/5 border border-rose-400/15 rounded-lg px-3 py-2">{error}</p>
              )}

              <button onClick={handleConnect}
                disabled={connecting || !form.login || !form.investorPassword || !form.server}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-slate-950 py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-2">
                <Zap className="w-4 h-4" />
                {connecting ? 'Холбогдож байна...' : 'MT5 Холбох'}
              </button>
              <p className="text-[10px] text-slate-600 text-center">Read-only горим — арилжаа нээх боломжгүй</p>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 'done' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-white">Амжилттай холбогдлоо!</p>
              <p className="text-xs text-slate-400 mt-1">Арилжааны түүх татагдаж байна...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Journal (trade list) view ─────────────────────────────────────────────────

export function JournalPage() {
  const { t } = useLang();
  const { trades, loading: isLoading, invalidate, applyUpdate, applyRemove } = useTrades();

  // Portfolio state
  const [view, setView]                     = useState('portfolio');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts]             = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  // Trade modals
  const [isAddModalOpen, setIsAddModalOpen]         = useState(false);
  const [isExportModalOpen, setIsExportModalOpen]   = useState(false);
  const [isImportMethodOpen, setIsImportMethodOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen]   = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen]     = useState(false);
  const [selectedTrade, setSelectedTrade]           = useState(null);
  const [editingTrade, setEditingTrade]             = useState(null);
  const [page, setPage]                             = useState(1);

  const [filters, setFilters] = useState(() => ({
    search: '',
    timeRange: localStorage.getItem('analytics_time_range') || 'all',
    status: 'all', markets: [], direction: 'all', session: 'all',
    hasScreenshot: false, hasNotes: false,
  }));
  const [customRange, setCustomRange] = useState(() => {
    try { return JSON.parse(localStorage.getItem('analytics_custom_range')); } catch { return null; }
  });

  useEffect(() => {
    localStorage.setItem('analytics_time_range', filters.timeRange);
  }, [filters.timeRange]);

  useEffect(() => { setPage(1); }, [filters, selectedAccount]);

  // Load MT5 accounts for portfolio
  const loadAccounts = async () => {
    setAccountsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/mt5/accounts`, { headers: getAuthHeaders(), credentials: 'include' });
      const d = await res.json();
      if (d.success) setAccounts(d.data);
    } catch {}
    setAccountsLoading(false);
  };
  useEffect(() => { loadAccounts(); }, []);

  // Handlers
  const handleEdit = (trade) => { setEditingTrade(trade); setIsAddModalOpen(true); };

  const handleDuplicate = (trade) => {
    const { id, ...rest } = trade;
    setIsAddModalOpen(false);
    setTimeout(() => { setEditingTrade({ ...rest, date: new Date().toISOString().slice(0, 16) }); setIsAddModalOpen(true); }, 50);
  };

  const handleDelete = async (id) => {
    applyRemove(id);
    try { await tradeService.deleteTrade(id); invalidate(); }
    catch (err) { console.error(err); invalidate(); alert("Алдаа гарлаа. Устгаж чадсангүй."); }
  };

  const handleMediaUpdate = (id, mediaUrls) => applyUpdate(id, { media_urls: mediaUrls });

  const handlePatch = async (id, changes) => {
    const trade = trades.find(t => t.id === id);
    if (!trade) return;
    applyUpdate(id, changes);
    try { await tradeService.updateTrade(id, { ...trade, ...changes }); invalidate(); }
    catch (err) { applyUpdate(id, trade); throw err; }
  };

  const handleCloseAddModal = () => { setIsAddModalOpen(false); setEditingTrade(null); invalidate(); };

  const handleSelectAccount = (account) => { setSelectedAccount(account); setView('trades'); };

  const handleBackToPortfolio = () => { setView('portfolio'); setSelectedAccount(null); };

  // Filter trades by selected account first, then apply filters
  const accountTrades = useMemo(() => {
    if (!selectedAccount) return trades;
    return trades.filter(t =>
      selectedAccount.id === 'personal' ? !t.account_id : t.account_id === selectedAccount.id
    );
  }, [trades, selectedAccount]);

  const filteredTrades = accountTrades.filter(trade => {
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const symbolMatch = trade.symbol?.toLowerCase().includes(s);
      const notesMatch  = trade.notes?.toLowerCase().includes(s) || trade.whyEntered?.toLowerCase().includes(s) ||
                          trade.whatHappened?.toLowerCase().includes(s) || trade.lessonLearned?.toLowerCase().includes(s);
      const tagsMatch   = trade.tags?.some(tag => tag.toLowerCase().includes(s)) ||
                          trade.positiveTags?.some(tag => tag.toLowerCase().includes(s)) ||
                          trade.mistakeTags?.some(tag => tag.toLowerCase().includes(s));
      if (!symbolMatch && !notesMatch && !tagsMatch) return false;
    }
    if (filters.status !== 'all' && trade.status !== filters.status) return false;
    if (filters.direction !== 'all' && trade.direction !== filters.direction) return false;
    if (filters.session !== 'all') {
      const sess = SESSIONS.find(s => s.id === filters.session);
      const ts = (trade.session || '').toLowerCase();
      if (ts !== filters.session.toLowerCase() && (!sess || ts !== sess.label.toLowerCase())) return false;
    }
    if (filters.markets.length > 0 && !filters.markets.includes(trade.market_type)) return false;
    if (filters.timeRange !== 'all') {
      const tradeDate = new Date(trade.entry_date || trade.date);
      const now = new Date();
      if (filters.timeRange === 'today'  && tradeDate.toDateString() !== now.toDateString()) return false;
      if (filters.timeRange === '7d'     && now - tradeDate > 7   * 86400000) return false;
      if (filters.timeRange === '1m'     && now - tradeDate > 30  * 86400000) return false;
      if (filters.timeRange === '3m'     && now - tradeDate > 90  * 86400000) return false;
      if (filters.timeRange === '6m'     && now - tradeDate > 180 * 86400000) return false;
      if (filters.timeRange === '1y'     && now - tradeDate > 365 * 86400000) return false;
      if (filters.timeRange === 'custom' && customRange?.start && customRange?.end) {
        const start = new Date(customRange.start);
        const end   = new Date(customRange.end); end.setHours(23, 59, 59, 999);
        if (tradeDate < start || tradeDate > end) return false;
      }
    }
    if (filters.hasScreenshot && !trade.screenshot_url) return false;
    if (filters.hasNotes && (!trade.notes && !trade.whyEntered && !trade.whatHappened)) return false;
    return true;
  });

  // ── Portfolio view ──────────────────────────────────────────────────────────
  if (view === 'portfolio') {
    return (
      <>
        <PortfolioView
          accounts={accounts}
          accountsLoading={accountsLoading || isLoading}
          trades={trades}
          onSelect={handleSelectAccount}
          onAddAccount={() => setIsAddAccountOpen(true)}
        />

        <AddAccountModal
          isOpen={isAddAccountOpen}
          onClose={() => setIsAddAccountOpen(false)}
          onSuccess={(action) => {
            if (action === 'csv') { setIsImportModalOpen(true); }
            else { loadAccounts(); }
          }}
          onManualTrade={() => {
            handleSelectAccount({ id: 'personal', login: 'Үндсэн данс', server: 'Гараар оруулсан' });
            setTimeout(() => { setEditingTrade(null); setIsAddModalOpen(true); }, 100);
          }}
        />

        {isAddModalOpen && (
          <AddTradeModal isOpen={isAddModalOpen} onClose={handleCloseAddModal} initialData={editingTrade} />
        )}
        {isImportModalOpen && (
          <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImportComplete={() => { setIsImportModalOpen(false); invalidate(); }} />
        )}
      </>
    );
  }

  // ── Trade list view ─────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToPortfolio}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {selectedAccount?.login || t('journalTitle')}
                </h1>
                {selectedAccount?.id !== 'personal' && selectedAccount?.status && (
                  <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    selectedAccount.status === 'CONNECTED'
                      ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                      : 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedAccount.status === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    {selectedAccount.status === 'CONNECTED' ? 'Холбогдсон' : 'Холбогдож байна'}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                {selectedAccount?.server || t('journalSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={() => setIsImportMethodOpen(true)}
              className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700">
              <Download className="w-4 h-4" />
              {t('import')}
            </button>
            <button onClick={() => setIsExportModalOpen(true)}
              className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700">
              <Upload className="w-4 h-4" />
              {t('export')}
            </button>
            <button onClick={() => { setEditingTrade(null); setIsAddModalOpen(true); }}
              className="flex-1 sm:flex-none bg-accent hover:bg-accent-hover text-slate-950 text-sm font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(200,240,122,0.15)]">
              <Plus className="w-4 h-4" />
              {t('newTrade')}
            </button>
          </div>
        </div>

        <TimeFilter
          value={filters.timeRange}
          onChange={(v) => setFilters(f => ({ ...f, timeRange: v }))}
          customRange={customRange}
          onCustomRangeChange={(r) => { setCustomRange(r); if (r) localStorage.setItem('analytics_custom_range', JSON.stringify(r)); }}
        />
      </div>

      <TradeFilters filters={filters} setFilters={setFilters} />

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : (() => {
          const totalPages = Math.ceil(filteredTrades.length / PAGE_SIZE);
          const safePage   = Math.min(page, Math.max(1, totalPages));
          const pagedTrades = filteredTrades.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

          const getPages = () => {
            if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
            const pages = [];
            if (safePage > 3)  { pages.push(1); if (safePage > 4) pages.push('…'); }
            for (let i = Math.max(1, safePage - 2); i <= Math.min(totalPages, safePage + 2); i++) pages.push(i);
            if (safePage < totalPages - 2) { if (safePage < totalPages - 3) pages.push('…'); pages.push(totalPages); }
            return pages;
          };

          return (
            <>
              <TradeTable
                trades={pagedTrades}
                onRowClick={(trade) => setSelectedTrade(trade)}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onPatch={handlePatch}
                onMediaUpdate={handleMediaUpdate}
              />

              {filteredTrades.length > 0 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 shrink-0">
                  <span className="text-xs text-slate-500">
                    Нийт <span className="text-slate-400 font-medium">{filteredTrades.length}</span> арилжааны{' '}
                    <span className="text-slate-400">{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredTrades.length)}</span> харагдаж байна
                  </span>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {getPages().map((p, i) =>
                        p === '…' ? (
                          <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-slate-600 text-sm">…</span>
                        ) : (
                          <button key={p} onClick={() => setPage(p)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                              p === safePage ? 'bg-accent text-slate-950 font-bold shadow-[0_0_12px_rgba(200,240,122,0.3)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}>
                            {p}
                          </button>
                        )
                      )}
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AddTradeModal isOpen={isAddModalOpen} onClose={handleCloseAddModal} initialData={editingTrade} />
      )}
      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
          onEdit={() => { setSelectedTrade(null); handleEdit(selectedTrade); }}
          onDuplicate={() => { setSelectedTrade(null); handleDuplicate(selectedTrade); }}
          onDelete={() => { handleDelete(selectedTrade.id); setSelectedTrade(null); }}
        />
      )}
      {isExportModalOpen && (
        <ExportModal onClose={() => setIsExportModalOpen(false)} trades={filteredTrades} />
      )}
      <ImportMethodModal
        isOpen={isImportMethodOpen}
        onClose={() => setIsImportMethodOpen(false)}
        onCSVImport={() => setIsImportModalOpen(true)}
        onAutoSync={() => setIsAddAccountOpen(true)}
        onManual={() => { setEditingTrade(null); setIsAddModalOpen(true); }}
      />
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => { setIsImportModalOpen(false); invalidate(); }}
        onImportComplete={invalidate}
      />
    </div>
  );
}
