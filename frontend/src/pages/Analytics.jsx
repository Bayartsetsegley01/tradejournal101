import { useState, useEffect, useCallback } from "react";
import { TimeFilter } from "@/components/features/analytics/TimeFilter";
import { AnalyticsTabs } from "@/components/features/analytics/AnalyticsTabs";
import { SummaryCards } from "@/components/features/analytics/SummaryCards";
import { ChartWithTabs } from "@/components/features/analytics/ChartWithTabs";
import { PerformanceCharts } from "@/components/features/analytics/PerformanceCharts";
import { MyGoalPanel } from "@/components/features/analytics/MyGoalPanel";
import { TradeCalendar } from "@/components/features/analytics/TradeCalendar";
import { analyticsService } from "@/services/analyticsService";
import { tradeService } from "@/services/tradeService";
import {
  AlertTriangle, Brain, ChevronDown, Loader2,
  TrendingUp, BarChart2, Sparkles,
} from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useTradesUpdated } from "@/lib/tradesSync";

const MNT_RATE = 3450;

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

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800/60 rounded-2xl h-80" />
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl h-80" />
      </div>
    </div>
  );
}

// ── Mistakes Panel ────────────────────────────────────────────────────────────
function MistakesPanel({ mistakesData, t }) {
  if (!mistakesData) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Common Mistakes */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700 transition-all">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">{t('commonMistakes')}</h3>
        </div>
        {mistakesData.mistakes?.length > 0 ? (
          <ul className="space-y-2">
            {mistakesData.mistakes.map((m, i) => (
              <li key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] text-slate-600 font-mono w-4 shrink-0">#{i + 1}</span>
                  <span className="text-sm text-slate-300 truncate group-hover:text-white transition-colors">{m.name}</span>
                </div>
                <span className="ml-3 text-xs font-bold text-rose-400 bg-rose-400/10 border border-rose-400/20 px-2.5 py-0.5 rounded-full shrink-0">
                  {m.count}×
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600 py-4 text-center">Алдаа байхгүй байна 🎉</p>
        )}
      </div>

      {/* Emotions */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700 transition-all">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">{t('emotions')}</h3>
        </div>
        {mistakesData.emotions?.length > 0 ? (
          <ul className="space-y-2">
            {mistakesData.emotions.slice(0, 6).map((e, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300 truncate">{e.name}</span>
                    <span className="text-xs font-semibold text-slate-400 ml-2 shrink-0">{e.percentage}%</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-700"
                      style={{ width: `${e.percentage}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600 py-4 text-center">Өгөгдөл байхгүй</p>
        )}
      </div>

      {/* Positive Tags */}
      {mistakesData.positiveTags?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700 transition-all lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Давуу талууд</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {mistakesData.positiveTags.slice(0, 10).map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full">
                {tag.name}
                <span className="text-emerald-600 font-bold">{tag.count}×</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const { t, lang } = useLang();
  const [activeTab, setActiveTab]   = useState("overview");
  const [timeRange, setTimeRange]   = useState(() => localStorage.getItem('analytics_time_range') || '7d');
  const [customRange, setCustomRange] = useState(() => {
    try { return JSON.parse(localStorage.getItem('analytics_custom_range')); } catch { return null; }
  });
  const [accountId, setAccountId]   = useState('all');
  const [currency, setCurrency]     = useState('$');
  const [mt5Accounts, setMt5Accounts] = useState([]);

  const [summary, setSummary]       = useState(null);
  const [charts, setCharts]         = useState(null);
  const [mistakesData, setMistakesData] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [trades, setTrades]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [mode, setMode]             = useState('database');

  // Load MT5 accounts for dropdown
  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || '') + '/api/mt5/accounts', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setMt5Accounts(d.data || []); })
      .catch(() => {});
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (timeRange === 'custom' && (!customRange?.start || !customRange?.end)) {
        setLoading(false);
        return;
      }

      const fetchRange = timeRange === 'custom' ? `${customRange.start}_${customRange.end}` : timeRange;

      const [summaryRes, chartsRes, mistakesRes, perfRes, tradesRes] = await Promise.all([
        analyticsService.getSummary(fetchRange, accountId),
        analyticsService.getCharts(fetchRange, accountId),
        analyticsService.getMistakes(fetchRange, accountId),
        analyticsService.getPerformance(fetchRange, accountId),
        tradeService.getTrades(),
      ]);

      if (summaryRes.success && chartsRes.success) {
        setSummary(summaryRes.data);
        setCharts(chartsRes.data);
        if (mistakesRes.success) setMistakesData(mistakesRes.data);
        if (perfRes.success) setPerformance(perfRes.data);
        if (tradesRes.success) setTrades(tradesRes.data);
        if (summaryRes.mode === 'mock') setMode('mock');
        else setMode('database');
      } else {
        setMode('mock');
        setSummary({ netPnl: 0, winRate: 0, profitFactor: 0, totalTrades: 0 });
        setCharts({ equityCurve: [] });
        setPerformance(null);
      }
    } catch (err) {
      console.error(err);
      setError(lang === 'mn' ? 'Сервертэй холбогдоход алдаа гарлаа' : 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [timeRange, customRange, accountId]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);
  useTradesUpdated(fetchDashboardData);

  const hasData = summary && charts && summary.totalTrades > 0;

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
              {lang === 'mn' ? 'Анализ' : 'Analytics'}
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

          {/* Tabs */}
          <AnalyticsTabs activeTab={activeTab} onChange={setActiveTab} />

          {/* Alerts */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {!error && mode === 'mock' && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>{t('previewMode')}:</strong> {t('previewModeDesc')}
              </span>
            </div>
          )}

          {/* Loading */}
          {loading && <LoadingSkeleton />}

          {/* Overview Tab */}
          {activeTab === "overview" && !loading && (
            !hasData ? <EmptyState t={t} /> : (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <SummaryCards data={summary} timeRange={timeRange} currency={currency} />

                <div className="space-y-5">
                  <ChartWithTabs
                    equityCurve={charts.equityCurve}
                    perfData={performance}
                    currency={currency}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2">
                      <TradeCalendar trades={trades} />
                    </div>
                    <div>
                      <MyGoalPanel />
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Detailed Tab */}
          {activeTab === "detailed" && !loading && (
            !hasData ? <EmptyState t={t} /> : (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                <PerformanceCharts timeRange={timeRange} accountId={accountId} currency={currency} />
              </div>
            )
          )}

          {/* Mistakes Tab */}
          {activeTab === "mistakes" && !loading && (
            !hasData ? <EmptyState t={t} /> : (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <MistakesPanel mistakesData={mistakesData} t={t} />
              </div>
            )
          )}

          {/* Calendar Tab */}
          {activeTab === "calendar" && !loading && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
              <TradeCalendar trades={trades} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
