import { useState, useEffect, useCallback, useRef } from "react";
import { TimeFilter } from "@/components/features/analytics/TimeFilter";
import { SummaryCards } from "@/components/features/analytics/SummaryCards";
import { ChartWithTabs } from "@/components/features/analytics/ChartWithTabs";
import { MyGoalPanel } from "@/components/features/analytics/MyGoalPanel";
import { TradeCalendar } from "@/components/features/analytics/TradeCalendar";
import { analyticsService } from "@/services/analyticsService";
import { tradeService } from "@/services/tradeService";
import { AlertTriangle, ChevronDown, BarChart2, Check, Wallet } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useTradesUpdated } from "@/lib/tradesSync";

const MNT_RATE = 3450;

function AccountDropdown({ value, onChange, accounts }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = [
    { value: 'all',      label: lang === 'mn' ? 'Бүх данс' : 'All Accounts',     icon: BarChart2 },
    { value: 'personal', label: lang === 'mn' ? 'Үндсэн данс' : 'Manual Trades', icon: Wallet },
    ...accounts.map(a => ({ value: String(a.id), label: a.name || a.login,        icon: BarChart2 })),
  ];
  const selected = options.find(o => String(o.value) === String(value)) || options[0];
  const SelIcon = selected.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
          open
            ? 'bg-slate-800 border-slate-600 text-white'
            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
        }`}
      >
        <SelIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="max-w-[130px] truncate">{selected.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/40 z-[200] py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 pt-2 pb-1.5 mb-1 border-b border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Данс сонгох</span>
          </div>
          {options.map(opt => {
            const Icon = opt.icon;
            const isSelected = String(value) === String(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isSelected ? 'text-white bg-slate-800/60' : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="flex-1 truncate text-left">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CurrencyToggle({ value, onChange }) {
  return (
    <div className="flex items-center bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden text-xs font-semibold">
      {['$', '₮'].map(c => (
        <button key={c} onClick={() => onChange(c)}
          className={`px-3 py-2 transition-all duration-150 ${
            value === c ? 'bg-accent text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}>{c}</button>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
        <BarChart2 className="w-7 h-7 text-slate-700" />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">Өгөгдөл байхгүй байна</h3>
      <p className="text-sm text-slate-500 max-w-xs">Арилжаа оруулаад дахин ирнэ үү</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 h-28" />
        ))}
      </div>
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl h-96" />
    </div>
  );
}

export function AnalyticsPage() {
  const { lang } = useLang();
  const [timeRange, setTimeRange] = useState(() => localStorage.getItem('analytics_time_range') || '7d');
  const [customRange, setCustomRange] = useState(() => {
    try { return JSON.parse(localStorage.getItem('analytics_custom_range')); } catch { return null; }
  });
  const [accountId, setAccountId] = useState('all');
  const [currency, setCurrency]   = useState('$');
  const [mt5Accounts, setMt5Accounts] = useState([]);

  const [summary, setSummary]         = useState(null);
  const [charts, setCharts]           = useState(null);
  const [performance, setPerformance] = useState(null);
  const [trades, setTrades]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || '') + '/api/mt5/accounts', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setMt5Accounts(d.data || []); })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (timeRange === 'custom' && (!customRange?.start || !customRange?.end)) {
        setLoading(false);
        return;
      }

      const fetchRange = timeRange === 'custom' ? `${customRange.start}_${customRange.end}` : timeRange;

      const [summaryRes, chartsRes, perfRes, tradesRes] = await Promise.all([
        analyticsService.getSummary(fetchRange, accountId),
        analyticsService.getCharts(fetchRange, accountId),
        analyticsService.getPerformance(fetchRange, accountId),
        tradeService.getTrades(),
      ]);

      if (summaryRes.success && chartsRes.success) {
        setSummary(summaryRes.data);
        setCharts(chartsRes.data);
        if (perfRes.success) setPerformance(perfRes.data);
        if (tradesRes.success) {
          // accountId-р filter хийж calendar болон chart-д зөв дата дамжуулна
          const allTrades = tradesRes.data;
          const filtered = accountId === 'all'
            ? allTrades
            : accountId === 'personal'
              ? allTrades.filter(t => !t.account_id)
              : allTrades.filter(t => String(t.account_id) === String(accountId));
          setTrades(filtered);
        }
      } else {
        setSummary({ netPnl: 0, winRate: 0, profitFactor: 0, totalTrades: 0 });
        setCharts({ equityCurve: [] });
        setPerformance(null);
      }
    } catch (err) {
      setError(lang === 'mn' ? 'Сервертэй холбогдоход алдаа гарлаа' : 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [timeRange, customRange, accountId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useTradesUpdated(fetchData);

  const hasData = summary && charts && summary.totalTrades > 0;

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {lang === 'mn' ? 'Анализ' : 'Analytics'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {accountId === 'all'
              ? (lang === 'mn' ? 'Гүйцэтгэлийн дүн шинжилгээ' : 'Performance overview')
              : accountId === 'personal'
                ? (lang === 'mn' ? 'Үндсэн данс · Гүйцэтгэлийн дүн шинжилгээ' : 'Manual Trades · Performance overview')
                : (() => { const a = mt5Accounts.find(x => String(x.id) === String(accountId)); return a ? `${a.name || a.login} · ${a.server}` : 'Гүйцэтгэлийн дүн шинжилгээ'; })()
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AccountDropdown value={accountId} onChange={setAccountId} accounts={mt5Accounts} />
          <CurrencyToggle value={currency} onChange={setCurrency} />
          <TimeFilter
            value={timeRange}
            onChange={v => { setTimeRange(v); localStorage.setItem('analytics_time_range', v); }}
            customRange={customRange}
            onCustomRangeChange={r => {
              setCustomRange(r);
              if (r) localStorage.setItem('analytics_custom_range', JSON.stringify(r));
            }}
          />
        </div>
      </div>

      <div className="space-y-5">

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {loading && <LoadingSkeleton />}

          {!loading && (
            !hasData ? <EmptyState /> : (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <SummaryCards data={summary} timeRange={timeRange} currency={currency} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
                  <div className="lg:col-span-2">
                    <ChartWithTabs
                      equityCurve={charts.equityCurve}
                      perfData={performance}
                      trades={trades}
                      currency={currency}
                    />
                  </div>
                  <div>
                    <MyGoalPanel />
                  </div>
                </div>

                <TradeCalendar trades={trades} />
              </div>
            )
          )}

      </div>
    </div>
  );
}
