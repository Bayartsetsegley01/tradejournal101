import { useState, useEffect, useCallback } from "react";
import { TimeFilter } from "@/components/features/analytics/TimeFilter";
import { SummaryCards } from "@/components/features/analytics/SummaryCards";
import { ChartWithTabs } from "@/components/features/analytics/ChartWithTabs";
import { RecentTradesPanel } from "@/components/features/analytics/RecentTradesPanel";
import { TradeCalendar } from "@/components/features/analytics/TradeCalendar";
import { analyticsService } from "@/services/analyticsService";
import { tradeService } from "@/services/tradeService";
import { AlertTriangle, ChevronDown, BarChart2, Sparkles } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useTradesUpdated } from "@/lib/tradesSync";

// ── Account Dropdown ──────────────────────────────────────────────────────────
function AccountDropdown({ value, onChange, accounts }) {
  const { lang } = useLang();
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-slate-900 border border-slate-700/60 text-slate-300 text-xs rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-accent/50 cursor-pointer hover:border-slate-600 transition-colors font-medium"
      >
        <option value="all">{lang === 'mn' ? 'Бүх данс' : 'All Accounts'}</option>
        <option value="personal">{lang === 'mn' ? 'Үндсэн данс' : 'Manual Trades'}</option>
        {accounts.map(a => (
          <option key={a.id} value={a.id}>{a.server} · {a.login}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
    </div>
  );
}

// ── Currency Toggle ───────────────────────────────────────────────────────────
function CurrencyToggle({ value, onChange }) {
  return (
    <div className="flex items-center bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden text-xs font-semibold">
      {['$', '₮'].map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`px-3 py-2 transition-all duration-150 ${
            value === c
              ? 'bg-accent text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800/60 rounded-2xl h-28" />
        ))}
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800/60 rounded-xl h-16" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800/60 rounded-2xl h-80" />
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl h-80" />
      </div>
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl h-64" />
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ t }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
        <BarChart2 className="w-7 h-7 text-slate-700" />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{t('noDataTitle')}</h3>
      <p className="text-sm text-slate-500 max-w-xs">{t('noDataDesc')}</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const { t, lang } = useLang();

  const [timeRange, setTimeRange] = useState(
    () => localStorage.getItem('analytics_time_range') || '7d'
  );
  const [customRange, setCustomRange] = useState(() => {
    try { return JSON.parse(localStorage.getItem('analytics_custom_range')); } catch { return null; }
  });
  const [accountId, setAccountId] = useState('all');
  const [currency,  setCurrency]  = useState('$');
  const [mt5Accounts, setMt5Accounts] = useState([]);

  const [summary, setSummary] = useState(null);
  const [charts,  setCharts]  = useState(null);
  const [trades,  setTrades]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Load MT5 accounts for dropdown
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

      const fetchRange = timeRange === 'custom'
        ? `${customRange.start}_${customRange.end}`
        : timeRange;

      const [summaryRes, chartsRes, tradesRes] = await Promise.all([
        analyticsService.getSummary(fetchRange, accountId),
        analyticsService.getCharts(fetchRange, accountId),
        tradeService.getTrades(),
      ]);

      if (summaryRes.success) setSummary(summaryRes.data);
      else setSummary({ netPnl: 0, winRate: 0, profitFactor: 0, totalTrades: 0 });

      if (chartsRes.success) setCharts(chartsRes.data);
      else setCharts({ equityCurve: [] });

      if (tradesRes.success) setTrades(tradesRes.data);
    } catch {
      setError(lang === 'mn' ? 'Сервертэй холбогдоход алдаа гарлаа' : 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [timeRange, customRange, accountId, lang]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useTradesUpdated(fetchData);

  const hasData = summary && (summary.totalTrades || 0) > 0;

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60 px-6 h-16 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">
              {lang === 'mn' ? 'Арилжааны аналитик' : 'Trade Analytics'}
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {lang === 'mn' ? 'Гүйцэтгэлийн дүн шинжилгээ' : 'Performance overview'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <AccountDropdown value={accountId} onChange={setAccountId} accounts={mt5Accounts} />
          <CurrencyToggle value={currency} onChange={setCurrency} />
          <TimeFilter
            value={timeRange}
            onChange={(v) => { setTimeRange(v); localStorage.setItem('analytics_time_range', v); }}
            customRange={customRange}
            onCustomRangeChange={(r) => {
              setCustomRange(r);
              if (r) localStorage.setItem('analytics_custom_range', JSON.stringify(r));
            }}
          />
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* Error alert */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && <LoadingSkeleton />}

          {/* Content */}
          {!loading && (
            !hasData ? <EmptyState t={t} /> : (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-400">

                {/* KPI cards (2 rows) */}
                <SummaryCards data={summary} currency={currency} />

                {/* Chart tabs + Recent trades */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2">
                    <ChartWithTabs
                      equityCurve={charts?.equityCurve || []}
                      trades={trades}
                      currency={currency}
                    />
                  </div>
                  <div className="h-[360px]">
                    <RecentTradesPanel trades={trades} currency={currency} />
                  </div>
                </div>

                {/* Trade calendar */}
                <TradeCalendar trades={trades} currency={currency} />

              </div>
            )
          )}

        </div>
      </div>
    </div>
  );
}
