import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { User, Palette, Globe, Bell, Shield, AlertTriangle, BarChart2, Copy, RefreshCw, Check, Eye, EyeOff, Plus, Trash2, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const timeAgo = (date) => {
  if (!date) return 'Хэзээ ч sync хийгдээгүй';
  const m = Math.floor((Date.now() - new Date(date)) / 60000);
  if (m < 1) return 'Саяхан';
  if (m < 60) return `${m} минутын өмнө`;
  if (m < 1440) return `${Math.floor(m / 60)} цагийн өмнө`;
  return `${Math.floor(m / 1440)} өдрийн өмнө`;
};

const STATUS = {
  CONNECTED:  { dot: 'bg-emerald-400 animate-pulse', pill: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20', label: 'Холбогдсон' },
  CONNECTING: { dot: 'bg-amber-400 animate-pulse',   pill: 'bg-amber-400/10 text-amber-400 border-amber-400/20',     label: 'Холбогдож байна' },
  ERROR:      { dot: 'bg-rose-400',                  pill: 'bg-rose-400/10 text-rose-400 border-rose-400/20',         label: 'Алдаа' },
};

// ── AccountCard ───────────────────────────────────────────────────────────────

function AccountCard({ account, onRefresh }) {
  const [syncing,  setSyncing]  = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [months,   setMonths]   = useState(3);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');

  const st = STATUS[account.status] || STATUS.ERROR;

  const handleSync = async () => {
    setSyncing(true); setResult(null); setError('');
    try {
      const res = await fetch(`${API_BASE}/mt5/sync/${account.id}`, {
        method: 'POST', headers: getAuthHeaders(), credentials: 'include',
        body: JSON.stringify({ months }),
      });
      const d = await res.json();
      if (d.success) { setResult(d.data); onRefresh(); }
      else setError(d.error || 'Sync алдаа');
    } catch (e) { setError(e.message); }
    setSyncing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/mt5/accounts/${account.id}`, {
        method: 'DELETE', headers: getAuthHeaders(), credentials: 'include',
      });
      onRefresh();
    } catch {}
    setDeleting(false);
  };

  return (
    <div className="group bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shrink-0">
            <BarChart2 className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white font-mono leading-none">{account.login}</p>
            <p className="text-[11px] text-slate-500 mt-1">{account.server}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border ${st.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
          <button onClick={handleDelete} disabled={deleting}
            className="p-1.5 rounded-lg text-slate-700 hover:text-rose-400 hover:bg-rose-400/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-600 mb-3">Сүүлд sync: {timeAgo(account.last_synced_at)}</p>

      <div className="flex items-center gap-2">
        <select value={months} onChange={e => setMonths(Number(e.target.value))}
          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-600">
          {[1, 2, 3, 6, 12].map(m => <option key={m} value={m}>{m} сар</option>)}
        </select>
        <button onClick={handleSync} disabled={syncing}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
          <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Татаж байна...' : 'Sync хийх'}
        </button>
      </div>

      {result && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/5 border border-emerald-400/15 rounded-lg px-2.5 py-1.5">
          <Check className="w-3 h-3 shrink-0" />
          {result.imported} шинэ арилжаа нэмэгдлээ
          {result.skipped > 0 && <span className="text-slate-500 ml-1">· {result.skipped} давхардал алгасав</span>}
        </div>
      )}
      {error && (
        <p className="mt-2.5 text-xs text-rose-400 bg-rose-400/5 border border-rose-400/15 rounded-lg px-2.5 py-1.5">{error}</p>
      )}
    </div>
  );
}

// ── ConnectForm ───────────────────────────────────────────────────────────────

function ConnectForm({ onSuccess, onCancel }) {
  const [form,     setForm]     = useState({ login: '', investorPassword: '', server: '' });
  const [showPass, setShowPass] = useState(false);
  const [step,     setStep]     = useState('idle');
  const [syncRes,  setSyncRes]  = useState(null);
  const [error,    setError]    = useState('');

  const handle = async () => {
    setError(''); setStep('connecting');
    try {
      const r1 = await fetch(`${API_BASE}/mt5/connect`, {
        method: 'POST', headers: getAuthHeaders(), credentials: 'include',
        body: JSON.stringify(form),
      });
      const d1 = await r1.json();
      if (!d1.success) { setError(d1.error || 'Холбоход алдаа'); setStep('idle'); return; }

      const accountId = d1.data.id;
      setStep('syncing');

      const r2 = await fetch(`${API_BASE}/mt5/sync/${accountId}`, {
        method: 'POST', headers: getAuthHeaders(), credentials: 'include',
        body: JSON.stringify({ months: 3 }),
      });
      const d2 = await r2.json();
      setSyncRes(d2.data);
      setStep('done');
      setTimeout(() => { onSuccess(); onCancel(); }, 2000);
    } catch (e) {
      setError(e.message); setStep('idle');
    }
  };

  const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/10 transition-all';

  if (step === 'done') return (
    <div className="bg-slate-950 border border-emerald-500/20 rounded-xl p-5 text-center">
      <div className="w-10 h-10 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-3">
        <Check className="w-5 h-5 text-emerald-400" />
      </div>
      <p className="text-sm font-semibold text-white">Амжилттай холбогдлоо!</p>
      {syncRes && <p className="text-xs text-slate-400 mt-1">{syncRes.imported} арилжаа нэмэгдлээ</p>}
    </div>
  );

  return (
    <div className="bg-slate-950 border border-accent/20 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-semibold text-white">Шинэ данс нэмэх</span>
        </div>
        <button onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Цуцлах</button>
      </div>

      {step !== 'idle' && (
        <div className="flex items-center gap-2.5 mb-3 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg">
          <RefreshCw className="w-3.5 h-3.5 text-accent animate-spin shrink-0" />
          <p className="text-xs text-slate-400">
            {step === 'connecting' ? 'MetaApi-т холбогдож байна... (30–60с)' : 'Арилжааны түүх татаж байна...'}
          </p>
        </div>
      )}

      <div className="space-y-2.5">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1.5">MT5 Login</label>
          <input
            type="text"
            name="mt5_login_field"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            value={form.login}
            onChange={e => setForm({...form, login: e.target.value})}
            placeholder="Дансны дугаар (жш: 107057802)"
            disabled={step !== 'idle'}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Investor Password</label>
          <div className="flex gap-2">
            <input
              type={showPass ? 'text' : 'password'}
              name="mt5_investor_pwd"
              autoComplete="new-password"
              value={form.investorPassword}
              onChange={e => setForm({...form, investorPassword: e.target.value})}
              placeholder="••••••••"
              disabled={step !== 'idle'}
              className={`${inputCls} flex-1`}
            />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-white transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Server</label>
          <input
            type="text"
            name="mt5_server_field"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            value={form.server}
            onChange={e => setForm({...form, server: e.target.value})}
            placeholder="MetaQuotes-Demo"
            disabled={step !== 'idle'}
            className={inputCls}
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-rose-400 bg-rose-400/5 border border-rose-400/15 rounded-lg px-3 py-2">{error}</p>
      )}

      <button onClick={handle}
        disabled={step !== 'idle' || !form.login || !form.investorPassword || !form.server}
        className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-slate-950 py-2.5 rounded-lg transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(200,240,122,0.1)]">
        <Zap className="w-4 h-4" />
        {step !== 'idle' ? 'Холбогдож байна...' : 'MT5 Холбох'}
      </button>
      <p className="text-[10px] text-slate-600 text-center mt-2">Read-only горим — арилжаа нээх боломжгүй</p>
    </div>
  );
}

// ── MT5Tab ────────────────────────────────────────────────────────────────────

function MT5Tab() {
  const [accounts,        setAccounts]        = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [apiKey,          setApiKey]          = useState(null);
  const [keyLoading,      setKeyLoading]      = useState(true);
  const [generating,      setGenerating]      = useState(false);
  const [copied,          setCopied]          = useState('');
  const [showKey,         setShowKey]         = useState(false);

  const backendUrl = import.meta.env.VITE_API_URL || 'https://tradejournal101-backend.onrender.com';
  const syncUrl    = `${backendUrl}/api/mt5/ea-sync`;

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

  useEffect(() => {
    fetch(`${API_BASE}/mt5/apikey`, { headers: getAuthHeaders(), credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setApiKey(d.data.api_key); })
      .finally(() => setKeyLoading(false));
  }, []);

  const generate = async () => {
    setGenerating(true);
    const res = await fetch(`${API_BASE}/mt5/apikey`, { method: 'POST', headers: getAuthHeaders(), credentials: 'include' });
    const d = await res.json();
    if (d.success) setApiKey(d.data.api_key);
    setGenerating(false);
  };

  const copy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const eaCode = `//+------------------------------------------------------------------+
//|  TradeJournal101.mq5  —  paste your API key below               |
//+------------------------------------------------------------------+
#property version "1.0"
#property strict

input string ApiUrl = "${syncUrl}";
input string ApiKey = "${apiKey || 'PASTE_YOUR_API_KEY_HERE'}";

void OnInit() {
   if(ApiKey == "" || ApiKey == "PASTE_YOUR_API_KEY_HERE")
      Alert("TradeJournal: API key орхигдсон байна!");
   else
      Print("TradeJournal EA started.");
}

void OnTradeTransaction(
   const MqlTradeTransaction& trans,
   const MqlTradeRequest& req,
   const MqlTradeResult& res)
{
   if(trans.type != TRADE_TRANSACTION_DEAL_ADD) return;
   ulong deal = trans.deal;
   if(!HistoryDealSelect(deal)) {
      HistorySelect(TimeCurrent()-86400, TimeCurrent());
      if(!HistoryDealSelect(deal)) return;
   }
   if(HistoryDealGetInteger(deal, DEAL_ENTRY) != DEAL_ENTRY_OUT) return;
   SyncDeal(deal);
}

void SyncDeal(ulong deal) {
   string sym    = HistoryDealGetString(deal, DEAL_SYMBOL);
   double profit = HistoryDealGetDouble(deal, DEAL_PROFIT)
                 + HistoryDealGetDouble(deal, DEAL_COMMISSION)
                 + HistoryDealGetDouble(deal, DEAL_SWAP);
   double exit_p = HistoryDealGetDouble(deal, DEAL_PRICE);
   double vol    = HistoryDealGetDouble(deal, DEAL_VOLUME);
   datetime dt   = (datetime)HistoryDealGetInteger(deal, DEAL_TIME);
   long type     = HistoryDealGetInteger(deal, DEAL_TYPE);
   ulong posId   = HistoryDealGetInteger(deal, DEAL_POSITION_ID);

   string dir = (type == DEAL_TYPE_SELL) ? "LONG" : "SHORT";

   string exitTime = TimeToString(dt, TIME_DATE|TIME_MINUTES);
   StringReplace(exitTime, ".", "-");

   double ep = 0; string entryTime = "";
   HistorySelect(dt - 86400*30, dt);
   for(int i = 0; i < HistoryDealsTotal(); i++) {
      ulong d2 = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(d2,DEAL_POSITION_ID)==posId &&
         HistoryDealGetInteger(d2,DEAL_ENTRY)==DEAL_ENTRY_IN) {
         ep = HistoryDealGetDouble(d2, DEAL_PRICE);
         datetime et = (datetime)HistoryDealGetInteger(d2, DEAL_TIME);
         entryTime = TimeToString(et, TIME_DATE|TIME_MINUTES);
         StringReplace(entryTime, ".", "-");
         break;
      }
   }

   string json = "{\\"symbol\\":\\""+sym+"\\",\\"direction\\":\\""+dir+"\\",";
   json += "\\"pnl\\":"+DoubleToString(profit,2)+",";
   json += "\\"exit_price\\":"+DoubleToString(exit_p,5)+",";
   json += "\\"exit_date\\":\\""+exitTime+"\\",";
   json += "\\"volume\\":"+DoubleToString(vol,2)+",\\"status\\":\\"CLOSED\\"";
   if(ep > 0) json += ",\\"entry_price\\":"+DoubleToString(ep,5)+",\\"entry_date\\":\\""+entryTime+"\\"";
   json += "}";

   char post[], resp[]; string respH;
   string headers = "Content-Type: application/json\\r\\nX-Api-Key: "+ApiKey+"\\r\\n";
   StringToCharArray(json, post, 0, StringLen(json));
   ArrayResize(post, ArraySize(post)-1);

   int code = WebRequest("POST", ApiUrl, headers, 5000, post, resp, respH);
   if(code==200||code==201) Print("Synced: ",sym," ",dir," PnL:",DoubleToString(profit,2));
   else Print("Sync failed (",code,"): ",CharArrayToString(resp));
}`;

  const STEPS = [
    { title: 'Кодыг хуулах',     desc: 'Дээрх MQL5 кодыг хуулах товч дарж clipboard руу хуулна' },
    { title: 'Файл үүсгэх',      desc: 'MT5 → File → Open Data Folder → MQL5 → Experts → TradeJournal101.mq5 файл үүсгэж paste хийнэ' },
    { title: 'WebRequest нэмэх', desc: 'MT5 → Tools → Options → Expert Advisors → "Allow WebRequest" → EA Sync URL оруулна' },
    { title: 'EA суулгах',        desc: 'Navigator → Expert Advisors → TradeJournal101 → Chart дээр drag хийнэ' },
    { title: 'API Key оруулах',   desc: 'EA Settings → ApiKey талбарт өөрийн API key-г оруулна. Smiley face харагдвал амжилттай!' },
  ];

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Page header */}
      <div>
        <h2 className="text-base font-semibold text-white">MetaTrader 5 холболт</h2>
        <p className="text-xs text-slate-500 mt-0.5">MT5 дансаа холбож арилжааны түүхийг автоматаар татна</p>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* ── Left: Auto-Sync ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-accent/15 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-accent" />
              </div>
              <span className="text-sm font-semibold text-white">Auto-Sync</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                Санал болгох
              </span>
            </div>
            {!showConnectForm && (
              <button onClick={() => setShowConnectForm(true)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-accent transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Нэмэх
              </button>
            )}
          </div>

          {showConnectForm && (
            <ConnectForm onSuccess={loadAccounts} onCancel={() => setShowConnectForm(false)} />
          )}

          {accountsLoading ? (
            <div className="space-y-2">
              {[0, 1].map(i => <div key={i} className="h-20 bg-slate-800/40 rounded-xl animate-pulse" />)}
            </div>
          ) : accounts.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center mx-auto mb-3">
                <BarChart2 className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-500">MT5 данс холбогдоогүй байна</p>
              <p className="text-xs text-slate-600 mt-1 mb-4">Investor password ашиглан read-only горимоор холбоно</p>
              <button onClick={() => setShowConnectForm(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 px-3 py-2 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Данс нэмэх
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map(acc => (
                <AccountCard key={acc.id} account={acc} onRefresh={loadAccounts} />
              ))}
            </div>
          )}
        </div>

        {/* ── Right: EA Sync ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-500/15 flex items-center justify-center">
              <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-sm font-semibold text-white">EA Sync</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Real-time
            </span>
          </div>

          {/* API Key */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">API Key</span>
              <button onClick={generate} disabled={generating}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-accent transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
                {apiKey ? 'Шинэчлэх' : 'Үүсгэх'}
              </button>
            </div>
            {keyLoading ? (
              <div className="h-9 bg-slate-800 rounded-lg animate-pulse" />
            ) : apiKey ? (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                <code className="flex-1 text-xs text-emerald-400 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                  {showKey ? apiKey : '••••••••••••••••••••••••' + apiKey.slice(-6)}
                </code>
                <button onClick={() => setShowKey(v => !v)}
                  className="p-1 text-slate-600 hover:text-slate-300 transition-colors shrink-0">
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => copy(apiKey, 'key')}
                  className="p-1 text-slate-600 hover:text-accent transition-colors shrink-0">
                  {copied === 'key' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-600 py-2">API key үүсгэгдээгүй байна — дээрх "Үүсгэх" дарна уу</p>
            )}
            {apiKey && (
              <p className="text-[10px] text-amber-400/60 mt-2">Шинэ key үүсгэвэл EA дотор дахин оруулах хэрэгтэй</p>
            )}
          </div>

          {/* Sync URL */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">EA Sync URL</p>
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
              <code className="flex-1 text-xs text-slate-400 font-mono overflow-hidden text-ellipsis whitespace-nowrap">{syncUrl}</code>
              <button onClick={() => copy(syncUrl, 'url')}
                className="p-1 text-slate-600 hover:text-accent transition-colors shrink-0">
                {copied === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* MQL5 Code */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                </div>
                <span className="text-[11px] text-slate-500 font-mono">TradeJournal101.mq5</span>
              </div>
              <button onClick={() => copy(eaCode, 'ea')}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-accent transition-colors">
                {copied === 'ea' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied === 'ea' ? 'Хуулсан' : 'Хуулах'}
              </button>
            </div>
            <pre className="p-4 text-[10px] text-slate-400 font-mono overflow-x-auto max-h-44 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">{eaCode}</pre>
          </div>

          {/* Installation timeline */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4">Суулгах заавар</p>
            <div className="relative">
              {STEPS.map((s, i) => (
                <div key={i} className="flex gap-3 relative">
                  {i < STEPS.length - 1 && (
                    <div className="absolute left-[13px] top-7 bottom-0 w-px bg-slate-800" />
                  )}
                  <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-accent shrink-0 z-10">
                    {i + 1}
                  </div>
                  <div className={i < STEPS.length - 1 ? 'pb-4' : ''}>
                    <p className="text-xs font-semibold text-slate-300 leading-tight">{s.title}</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── SettingsPage ──────────────────────────────────────────────────────────────

export function SettingsPage() {
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('app_profile');
    const extra = saved ? JSON.parse(saved) : {};
    return {
      avatar: extra.avatar ?? null,
      age: extra.age ?? '',
      gender: extra.gender ?? 'other',
      phone: extra.phone ?? '',
      name: user?.name ?? extra.name ?? '',
      email: user?.email ?? extra.email ?? '',
    };
  });

  useEffect(() => {
    if (user) {
      setProfile(p => ({ ...p, name: user.name ?? p.name, email: user.email ?? p.email }));
    }
  }, [user?.id]);

  const [appearance, setAppearance] = useState(() => {
    const saved = localStorage.getItem('app_appearance');
    return saved ? JSON.parse(saved) : { theme: "dark" };
  });
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('app_preferences');
    return saved ? JSON.parse(saved) : { language: "mn", currency: "USD", timezone: "Asia/Ulaanbaatar" };
  });
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('app_notifications');
    return saved ? JSON.parse(saved) : { email: true, push: false, tradeAlerts: true };
  });

  useEffect(() => {
    const { name: _n, email: _e, ...extra } = profile;
    localStorage.setItem('app_profile', JSON.stringify(extra));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('app_appearance', JSON.stringify(appearance));
    window.dispatchEvent(new Event('theme-changed'));
  }, [appearance]);

  useEffect(() => {
    localStorage.setItem('app_preferences', JSON.stringify(preferences));
    window.dispatchEvent(new Event('language-changed'));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('app_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfile({ ...profile, avatar: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => setProfile({ ...profile, avatar: null });

  const handleDeleteData = () => {
    console.log("Deleting all data...");
    setShowDeleteModal(false);
  };

  const t = {
    mn: {
      settings: "Тохиргоо", settingsDesc: "Бүртгэл болон системийн тохиргоо",
      profile: "Профайл", appearance: "Харагдах байдал", preferences: "Тохиргоо",
      notifications: "Мэдэгдэл", privacy: "Нууцлал",
    },
    en: {
      settings: "Settings", settingsDesc: "Account and system preferences",
      profile: "Profile", appearance: "Appearance", preferences: "Preferences",
      notifications: "Notifications", privacy: "Privacy",
    },
  };

  const lang = preferences.language || 'mn';
  const text = t[lang];

  const tabs = [
    { id: "profile",       label: text.profile,       icon: User },
    { id: "appearance",    label: text.appearance,    icon: Palette },
    { id: "preferences",   label: text.preferences,   icon: Globe },
    { id: "notifications", label: text.notifications, icon: Bell },
    { id: "privacy",       label: text.privacy,       icon: Shield },
    { id: "mt5",           label: "MetaTrader 5",     icon: BarChart2 },
  ];

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{text.settings}</h1>
        <p className="text-sm text-slate-400 mt-1">{text.settingsDesc}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive ? "bg-accent/10 text-accent translate-x-1" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 hover:translate-x-1"
                }`}>
                <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/5 blur-[100px] rounded-full pointer-events-none" />

          {activeTab === "profile" && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-semibold text-white">Профайл мэдээлэл</h2>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-300 overflow-hidden relative group shadow-lg">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    profile.name.charAt(0)
                  )}
                  {profile.avatar && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <button onClick={handleRemoveImage} className="text-white text-xs font-medium hover:text-rose-400 transition-colors">Устгах</button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-colors border border-slate-700 cursor-pointer text-center shadow-sm hover:shadow-md">
                    Зураг солих
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
              <div className="grid gap-5 max-w-md mt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Нэр</label>
                  <input type="text" value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">И-мэйл хаяг</label>
                  <input type="email" value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Утасны дугаар</label>
                  <input type="tel" value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Нас</label>
                    <input type="number" value={profile.age || ''}
                      onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Хүйс</label>
                    <select value={profile.gender || 'other'}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner appearance-none">
                      <option value="male">Эрэгтэй</option>
                      <option value="female">Эмэгтэй</option>
                      <option value="other">Бусад</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-semibold text-white">Харагдах байдал</h2>
              <div className="grid gap-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-3">Загвар (Theme)</label>
                  <div className="flex gap-3 p-1 bg-slate-950/50 rounded-xl border border-slate-800/50">
                    {["dark", "light", "system"].map((t) => (
                      <button key={t} onClick={() => setAppearance({ ...appearance, theme: t })}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-all duration-300 ${
                          appearance.theme === t ? "bg-slate-800 text-accent shadow-md" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-semibold text-white">Тохиргоо</h2>
              <div className="grid gap-5 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Хэл</label>
                  <select value={preferences.language} onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner appearance-none">
                    <option value="mn">Монгол</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Үндсэн мөнгөн тэмдэгт</label>
                  <select value={preferences.currency} onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner appearance-none">
                    <option value="USD">USD ($)</option>
                    <option value="MNT">MNT (₮)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Цагийн бүс</label>
                  <select value={preferences.timezone} onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner appearance-none">
                    <option value="Asia/Ulaanbaatar">Asia/Ulaanbaatar (ULAT)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-semibold text-white">Мэдэгдэл</h2>
              <div className="grid gap-6 max-w-md">
                <label className="flex items-center justify-between cursor-pointer group p-3 -mx-3 rounded-xl hover:bg-slate-800/30 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">И-мэйл мэдэгдэл</div>
                    <div className="text-xs text-slate-500 mt-1">Долоо хоногийн тайлан болон зөвлөмжүүд</div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${notifications.email ? 'bg-accent' : 'bg-slate-800'}`}
                    onClick={() => setNotifications({...notifications, email: !notifications.email})}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm ${notifications.email ? 'left-7' : 'left-1'}`} />
                  </div>
                </label>
                <label className="flex items-center justify-between cursor-pointer group p-3 -mx-3 rounded-xl hover:bg-slate-800/30 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Арилжааны анхааруулга</div>
                    <div className="text-xs text-slate-500 mt-1">Алдаа гаргах эрсдэлтэй үед AI анхааруулах</div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${notifications.tradeAlerts ? 'bg-accent' : 'bg-slate-800'}`}
                    onClick={() => setNotifications({...notifications, tradeAlerts: !notifications.tradeAlerts})}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm ${notifications.tradeAlerts ? 'left-7' : 'left-1'}`} />
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeTab === "mt5" && <MT5Tab />}

          {activeTab === "privacy" && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-semibold text-white">Өгөгдөл ба Нууцлал</h2>
              <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-5">
                <p className="text-sm text-slate-300 leading-relaxed">
                  Таны өгөгдөл найдвартай хадгалагдаж байгаа бөгөөд AI анализ зөвхөн таны зөвшөөрөлтэйгөөр хийгдэнэ. Бид таны мэдээллийг гуравдагч этгээдэд дамжуулахгүй.
                </p>
              </div>
              <div className="pt-6 mt-2 border-t border-slate-800">
                <h3 className="text-sm font-medium text-white mb-2">Аюултай бүс</h3>
                <p className="text-xs text-slate-500 mb-4">Энэ үйлдэл нь буцаах боломжгүй бөгөөд таны бүх арилжааны түүх, тохиргоо устгагдах болно.</p>
                <button onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-medium rounded-xl transition-colors border border-rose-500/20">
                  Бүх өгөгдлөө устгах
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-4 text-rose-400">
              <div className="w-12 h-12 rounded-full bg-rose-400/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Бүх өгөгдлийг устгах уу?</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Та өөрийн бүх арилжааны түүх, тохиргоо, профайл мэдээллээ устгах гэж байна. Энэ үйлдэл нь <strong className="text-white">буцаах боломжгүй</strong> бөгөөд таны бүх мэдээлэл бүрмөсөн устах болно.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                Цуцлах
              </button>
              <button onClick={handleDeleteData}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-lg shadow-rose-500/20">
                Тийм, устгах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
