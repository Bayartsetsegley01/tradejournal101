import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { User, Palette, Globe, Bell, Shield, AlertTriangle, BarChart2, Copy, RefreshCw, Check, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

function MT5Tab() {
  // EA key state
  const [apiKey, setApiKey] = useState(null);
  const [keyLoading, setKeyLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState('');
  const [showKey, setShowKey] = useState(false);

  // MetaApi state
  const [maStatus, setMaStatus] = useState(null);
  const [maLoading, setMaLoading] = useState(true);
  const [maForm, setMaForm] = useState({ login: '', password: '', server: '' });
  const [showPass, setShowPass] = useState(false);
  const [maConnecting, setMaConnecting] = useState(false);
  const [maDisconnecting, setMaDisconnecting] = useState(false);
  const [maSyncing, setMaSyncing] = useState(false);
  const [maMonths, setMaMonths] = useState(3);
  const [maSyncResult, setMaSyncResult] = useState(null);
  const [maError, setMaError] = useState('');

  const backendUrl = import.meta.env.VITE_API_URL || 'https://tradejournal101-backend.onrender.com';
  const syncUrl = `${backendUrl}/api/mt5/sync`;

  useEffect(() => {
    fetch(`${API_BASE}/mt5/apikey`, { headers: getAuthHeaders(), credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setApiKey(d.data.api_key); })
      .finally(() => setKeyLoading(false));
  }, []);

  const loadMaStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/mt5/status`, { headers: getAuthHeaders(), credentials: 'include' });
      const d = await res.json();
      if (d.success) setMaStatus(d.data);
    } catch {}
    setMaLoading(false);
  };
  useEffect(() => { loadMaStatus(); }, []);

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

  const connectMa = async () => {
    setMaConnecting(true);
    setMaError('');
    setMaSyncResult(null);
    try {
      const res = await fetch(`${API_BASE}/mt5/connect`, {
        method: 'POST', headers: getAuthHeaders(), credentials: 'include',
        body: JSON.stringify(maForm),
      });
      const d = await res.json();
      if (d.success) {
        setMaStatus({ connected: true, state: d.data.state, login: maForm.login, server: maForm.server });
        setMaForm({ login: '', password: '', server: '' });
        let tries = 0;
        const poll = setInterval(async () => {
          tries++;
          const r2 = await fetch(`${API_BASE}/mt5/status`, { headers: getAuthHeaders(), credentials: 'include' });
          const d2 = await r2.json();
          if (d2.success) setMaStatus(d2.data);
          if (d2.data?.state === 'DEPLOYED' || tries >= 18) clearInterval(poll);
        }, 10000);
      } else {
        setMaError(d.error || 'Холбоход алдаа гарлаа');
      }
    } catch (e) { setMaError(e.message); }
    setMaConnecting(false);
  };

  const syncHistory = async () => {
    setMaSyncing(true);
    setMaSyncResult(null);
    setMaError('');
    try {
      const res = await fetch(`${API_BASE}/mt5/sync-history`, {
        method: 'POST', headers: getAuthHeaders(), credentials: 'include',
        body: JSON.stringify({ months: maMonths }),
      });
      const d = await res.json();
      if (d.success) setMaSyncResult(d.data);
      else setMaError(d.error || 'Sync алдаа гарлаа');
    } catch (e) { setMaError(e.message); }
    setMaSyncing(false);
  };

  const disconnectMa = async () => {
    setMaDisconnecting(true);
    try {
      await fetch(`${API_BASE}/mt5/disconnect`, { method: 'DELETE', headers: getAuthHeaders(), credentials: 'include' });
      setMaStatus({ connected: false });
    } catch {}
    setMaDisconnecting(false);
  };

  const stateLabel = (s) => ({ DEPLOYED: 'Холбогдсон', DEPLOYING: 'Холбогдож байна...', UNDEPLOYED: 'Идэвхгүй', DELETING: 'Устгаж байна' }[s] || s || '...');
  const stateColor = (s) => s === 'DEPLOYED' ? 'text-emerald-400' : s === 'DEPLOYING' ? 'text-amber-400' : 'text-slate-400';

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

   // exit sell → was LONG trade; exit buy → was SHORT trade
   string dir = (type == DEAL_TYPE_SELL) ? "LONG" : "SHORT";

   string exitTime = TimeToString(dt, TIME_DATE|TIME_MINUTES);
   StringReplace(exitTime, ".", "-");

   // Find entry deal
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

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── MetaApi Section ─────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">MT5 Автоматаар Холбох</h2>
        <p className="text-sm text-slate-400">Login, Investor Password, Server оруулахад л болно — read-only горим</p>
      </div>

      {maLoading ? (
        <div className="h-24 bg-slate-800/40 rounded-xl animate-pulse" />
      ) : maStatus?.connected ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${maStatus.state === 'DEPLOYED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className={`text-sm font-medium ${stateColor(maStatus.state)}`}>{stateLabel(maStatus.state)}</span>
            </div>
            <button onClick={disconnectMa} disabled={maDisconnecting}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors disabled:opacity-50">
              {maDisconnecting ? 'Устгаж байна...' : 'Холболт устгах'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Login</p>
              <p className="text-slate-200 font-mono">{maStatus.login}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Server</p>
              <p className="text-slate-200 font-mono text-xs">{maStatus.server}</p>
            </div>
          </div>
          <div className="pt-3 border-t border-emerald-500/10 flex items-center gap-3 flex-wrap">
            <select value={maMonths} onChange={e => setMaMonths(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50">
              {[1, 2, 3, 6, 12].map(m => <option key={m} value={m}>{m} сар</option>)}
            </select>
            <button onClick={syncHistory} disabled={maSyncing || maStatus.state !== 'DEPLOYED'}
              className="flex items-center gap-2 text-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${maSyncing ? 'animate-spin' : ''}`} />
              {maSyncing ? 'Татаж байна...' : 'Арилжааны түүх татах'}
            </button>
          </div>
          {maSyncResult && (
            <p className="text-xs text-emerald-400">
              {maSyncResult.imported}/{maSyncResult.total} арилжаа амжилттай импортлогдлоо
              {maSyncResult.errors?.length > 0 && <span className="text-amber-400 ml-2">({maSyncResult.errors.length} алдаатай)</span>}
            </p>
          )}
          {maError && <p className="text-xs text-rose-400">{maError}</p>}
        </div>
      ) : (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 space-y-4">
          <div className="grid gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">MT5 Login (дансны дугаар)</label>
              <input type="text" value={maForm.login} onChange={e => setMaForm({...maForm, login: e.target.value})}
                placeholder="12345678"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Investor Password (зөвхөн уншдаг)</label>
              <div className="flex items-center gap-2">
                <input type={showPass ? 'text' : 'password'} value={maForm.password} onChange={e => setMaForm({...maForm, password: e.target.value})}
                  placeholder="••••••••"
                  className="flex-1 bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent/50 transition-all" />
                <button type="button" onClick={() => setShowPass(v => !v)} className="p-2 text-slate-400 hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Server</label>
              <input type="text" value={maForm.server} onChange={e => setMaForm({...maForm, server: e.target.value})}
                placeholder="MetaQuotes-Demo"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent/50 transition-all" />
            </div>
          </div>
          {maError && <p className="text-xs text-rose-400">{maError}</p>}
          <button onClick={connectMa}
            disabled={maConnecting || !maForm.login || !maForm.password || !maForm.server}
            className="w-full flex items-center justify-center gap-2 text-sm bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${maConnecting ? 'animate-spin' : ''}`} />
            {maConnecting ? 'Холбогдож байна... (30-60с)' : 'MT5 Холбох'}
          </button>
          <p className="text-xs text-slate-500">Investor password нь зөвхөн уншдаг — арилжаа нээх, хаах боломжгүй</p>
        </div>
      )}

      {/* ── EA Section ──────────────────────────── */}
      <div className="border-t border-slate-800 pt-2">
        <h3 className="text-sm font-semibold text-slate-400 mb-4">MQL5 Expert Advisor (Дэвшилтэт / Real-time sync)</h3>

        {/* API Key */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 space-y-3 mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">API Key</p>
          {keyLoading ? (
            <div className="h-9 bg-slate-800 rounded-lg animate-pulse" />
          ) : apiKey ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                {showKey ? apiKey : '•'.repeat(32) + apiKey.slice(-8)}
              </code>
              <button onClick={() => setShowKey(v => !v)} className="p-2 text-slate-400 hover:text-white transition-colors">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => copy(apiKey, 'key')} className="p-2 text-slate-400 hover:text-accent transition-colors">
                {copied === 'key' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">API key үүсгэгдээгүй байна</p>
          )}
          <button onClick={generate} disabled={generating}
            className="flex items-center gap-2 text-sm bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {apiKey ? 'Шинэ key үүсгэх' : 'API Key үүсгэх'}
          </button>
          {apiKey && <p className="text-xs text-amber-400/70">Шинэ key үүсгэвэл EA дотор солих хэрэгтэй</p>}
        </div>

        {/* Sync URL */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 space-y-2 mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sync URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono overflow-hidden text-ellipsis whitespace-nowrap">{syncUrl}</code>
            <button onClick={() => copy(syncUrl, 'url')} className="p-2 text-slate-400 hover:text-accent transition-colors">
              {copied === 'url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* EA Code */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">MQL5 Expert Advisor код</p>
            <button onClick={() => copy(eaCode, 'ea')} className="flex items-center gap-1.5 text-xs text-accent hover:underline">
              {copied === 'ea' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === 'ea' ? 'Хуулсан!' : 'Кодыг хуулах'}
            </button>
          </div>
          <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-[10px] text-slate-400 font-mono overflow-x-auto max-h-48 leading-relaxed">{eaCode}</pre>
        </div>

        {/* Setup steps */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Суулгах заавар</p>
          <ol className="space-y-2">
            {[
              'Дээрх кодыг хуулж MT5 → File → Open Data Folder → MQL5 → Experts дотор TradeJournal101.mq5 нэртэй файл үүсгэж paste хийнэ',
              'MT5 → Tools → Options → Expert Advisors → "Allow WebRequest for listed URL" нэмж Sync URL-ийг жагсаана',
              'MT5 → Navigator → Expert Advisors → TradeJournal101 → Chart дээр drag хийж суулгана',
              'EA Settings дээр ApiKey талбарт өөрийн API key-г оруулна',
              'Smiley face харагдвал амжилттай — Trade хаагдах бүрт автоматаар sync болно',
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-300">
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

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

  // Form states — name/email always come from the authenticated user
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

  // Sync name/email whenever the authenticated user changes
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

  // Auto-save extra profile fields only (name/email live in DB, not localStorage)
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
    // Dispatch a custom event for language change if needed globally
    window.dispatchEvent(new Event('language-changed'));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('app_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfile({ ...profile, avatar: null });
  };

  const handleDeleteData = () => {
    // Implement actual deletion logic here
    console.log("Deleting all data...");
    setShowDeleteModal(false);
    // Optional: show a success toast
  };

  const t = {
    mn: {
      settings: "Тохиргоо",
      settingsDesc: "Бүртгэл болон системийн тохиргоо",
      profile: "Профайл",
      appearance: "Харагдах байдал",
      preferences: "Тохиргоо",
      notifications: "Мэдэгдэл",
      privacy: "Нууцлал",
      plan: "План & Төлбөр",
      profileInfo: "Профайл мэдээлэл",
      changePhoto: "Зураг солих",
      remove: "Устгах",
      name: "Нэр",
      email: "И-мэйл хаяг",
      phone: "Утасны дугаар",
      age: "Нас",
      gender: "Хүйс",
      male: "Эрэгтэй",
      female: "Эмэгтэй",
      other: "Бусад",
      theme: "Загвар (Theme)",
      language: "Хэл",
      currency: "Үндсэн мөнгөн тэмдэгт",
      timezone: "Цагийн бүс",
      emailNotif: "И-мэйл мэдэгдэл",
      emailNotifDesc: "Долоо хоногийн тайлан болон зөвлөмжүүд",
      tradeAlerts: "Арилжааны анхааруулга",
      tradeAlertsDesc: "Алдаа гаргах эрсдэлтэй үед AI анхааруулах",
      dataPrivacy: "Өгөгдөл ба Нууцлал",
      dataPrivacyDesc: "Таны өгөгдөл найдвартай хадгалагдаж байгаа бөгөөд AI анализ зөвхөн таны зөвшөөрөлтэйгөөр хийгдэнэ. Бид таны мэдээллийг гуравдагч этгээдэд дамжуулахгүй.",
      dangerZone: "Аюултай бүс",
      dangerZoneDesc: "Энэ үйлдэл нь буцаах боломжгүй бөгөөд таны бүх арилжааны түүх, тохиргоо устгагдах болно.",
      deleteAll: "Бүх өгөгдлөө устгах",
      planActive: "Идэвхтэй байна",
      nextPayment: "Дараагийн төлбөр: 2026 оны 5 сарын 5",
      updatePayment: "Төлбөрийн мэдээлэл шинэчлэх",
      deleteConfirmTitle: "Бүх өгөгдлийг устгах уу?",
      deleteConfirmDesc: "Та өөрийн бүх арилжааны түүх, тохиргоо, профайл мэдээллээ устгах гэж байна. Энэ үйлдэл нь буцаах боломжгүй бөгөөд таны бүх мэдээлэл бүрмөсөн устах болно.",
      cancel: "Цуцлах",
      yesDelete: "Тийм, устгах"
    },
    en: {
      settings: "Settings",
      settingsDesc: "Account and system preferences",
      profile: "Profile",
      appearance: "Appearance",
      preferences: "Preferences",
      notifications: "Notifications",
      privacy: "Privacy",
      plan: "Plan & Billing",
      profileInfo: "Profile Information",
      changePhoto: "Change Photo",
      remove: "Remove",
      name: "Name",
      email: "Email Address",
      phone: "Phone Number",
      age: "Age",
      gender: "Gender",
      male: "Male",
      female: "Female",
      other: "Other",
      theme: "Theme",
      language: "Language",
      currency: "Base Currency",
      timezone: "Timezone",
      emailNotif: "Email Notifications",
      emailNotifDesc: "Weekly reports and recommendations",
      tradeAlerts: "Trading Alerts",
      tradeAlertsDesc: "AI warnings when at risk of making mistakes",
      dataPrivacy: "Data & Privacy",
      dataPrivacyDesc: "Your data is securely stored and AI analysis is only performed with your permission. We do not share your information with third parties.",
      dangerZone: "Danger Zone",
      dangerZoneDesc: "This action cannot be undone. All your trading history and settings will be deleted.",
      deleteAll: "Delete All Data",
      planActive: "Active",
      nextPayment: "Next payment: May 5, 2026",
      updatePayment: "Update Payment Info",
      deleteConfirmTitle: "Delete all data?",
      deleteConfirmDesc: "You are about to delete all your trading history, settings, and profile information. This action cannot be undone and all your data will be permanently lost.",
      cancel: "Cancel",
      yesDelete: "Yes, delete"
    }
  };

  const lang = preferences.language || 'mn';
  const text = t[lang];

  const tabs = [
    { id: "profile", label: text.profile, icon: User },
    { id: "appearance", label: text.appearance, icon: Palette },
    { id: "preferences", label: text.preferences, icon: Globe },
    { id: "notifications", label: text.notifications, icon: Bell },
    { id: "privacy", label: text.privacy, icon: Shield },
    { id: "mt5", label: "MetaTrader 5", icon: BarChart2 },
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
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive ? "bg-accent/10 text-accent translate-x-1" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 hover:translate-x-1"
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
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
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">И-мэйл хаяг</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Утасны дугаар</label>
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner"
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Нас</label>
                    <input
                      type="number"
                      value={profile.age || ''}
                      onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Хүйс</label>
                    <select
                      value={profile.gender || 'other'}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner appearance-none"
                    >
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
                      <button
                        key={t}
                        onClick={() => setAppearance({ ...appearance, theme: t })}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-all duration-300 ${
                          appearance.theme === t
                            ? "bg-slate-800 text-accent shadow-md"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                        }`}
                      >
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
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner appearance-none"
                  >
                    <option value="mn">Монгол</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Үндсэн мөнгөн тэмдэгт</label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner appearance-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="MNT">MNT (₮)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Цагийн бүс</label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner appearance-none"
                  >
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
                  <div className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${notifications.email ? 'bg-accent' : 'bg-slate-800'}`} onClick={() => setNotifications({...notifications, email: !notifications.email})}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm ${notifications.email ? 'left-7' : 'left-1'}`} />
                  </div>
                </label>
                <label className="flex items-center justify-between cursor-pointer group p-3 -mx-3 rounded-xl hover:bg-slate-800/30 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Арилжааны анхааруулга</div>
                    <div className="text-xs text-slate-500 mt-1">Алдаа гаргах эрсдэлтэй үед AI анхааруулах</div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${notifications.tradeAlerts ? 'bg-accent' : 'bg-slate-800'}`} onClick={() => setNotifications({...notifications, tradeAlerts: !notifications.tradeAlerts})}>
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
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-medium rounded-xl transition-colors border border-rose-500/20"
                >
                  Бүх өгөгдлөө устгах
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Цуцлах
              </button>
              <button 
                onClick={handleDeleteData}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-lg shadow-rose-500/20"
              >
                Тийм, устгах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
