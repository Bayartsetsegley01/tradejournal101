import { useState, useEffect, useCallback } from "react";
import { TimeFilter } from "@/components/features/analytics/TimeFilter";
import { AnalyticsTabs } from "@/components/features/analytics/AnalyticsTabs";
import { SummaryCards } from "@/components/features/analytics/SummaryCards";
import { EquityChart } from "@/components/features/analytics/EquityChart";
import { AiInsightPanel } from "@/components/features/analytics/AiInsightPanel";
import { PerformanceCharts } from "@/components/features/analytics/PerformanceCharts";
import { StrategyTable } from "@/components/features/analytics/StrategyTable";
import { MyGoalPanel } from "@/components/features/analytics/MyGoalPanel";
import { TradeCalendar } from "@/components/features/analytics/TradeCalendar";
import { analyticsService } from "@/services/analyticsService";
import { tradeService } from "@/services/tradeService";
import { AlertTriangle, Brain, ChevronDown } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useTradesUpdated } from "@/lib/tradesSync";

const MNT_RATE = 3450;

export function AnalyticsPage() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState(() => localStorage.getItem('analytics_time_range') || '7d');
  const [customRange, setCustomRange] = useState(() => {
    try { return JSON.parse(localStorage.getItem('analytics_custom_range')); } catch { return null; }
  });
  const [accountId, setAccountId] = useState('all');
  const [currency, setCurrency] = useState('$');
  const [mt5Accounts, setMt5Accounts] = useState([]);

  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [mistakesData, setMistakesData] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('database');

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || '') + '/api/mt5/accounts', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setMt5Accounts(d.data || []); })
      .catch(() => {});
  }, []);

  const toDisplay = (val) => {
    const n = parseFloat(val) || 0;
    return currency === '₮' ? Math.round(n * MNT_RATE).toLocaleString() + ' ₮' : n.toFixed(2) + ' $';
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      if (timeRange === 'custom' && (!customRange || !customRange.start || !customRange.end)) {
        setLoading(false);
        return;
      }

      const fetchRange = timeRange === 'custom' ? `${customRange.start}_${customRange.end}` : timeRange;

      const [summaryRes, chartsRes, mistakesRes, tradesRes] = await Promise.all([
        analyticsService.getSummary(fetchRange, accountId),
        analyticsService.getCharts(fetchRange, accountId),
        analyticsService.getMistakes(fetchRange, accountId),
        tradeService.getTrades(),
      ]);

      if (summaryRes.success && chartsRes.success) {
        setSummary(summaryRes.data);
        setCharts(chartsRes.data);
        if (mistakesRes.success) setMistakesData(mistakesRes.data);
        if (tradesRes.success) setTrades(tradesRes.data);
        if (summaryRes.mode === 'mock') setMode('mock');
      } else {
        console.warn("Backend failed, using frontend fallback mock data");
        setSummary({ netPnl: 1250.50, winRate: 64.5, profitFactor: 1.8, totalTrades: 42 });
        setCharts({ equityCurve: [
          { date: '2023-10-01', pnl: 100, equity: 100 },
          { date: '2023-10-05', pnl: -50, equity: 50 },
          { date: '2023-10-10', pnl: 200, equity: 250 },
          { date: '2023-10-15', pnl: 150, equity: 400 },
          { date: '2023-10-20', pnl: -100, equity: 300 },
          { date: '2023-10-25', pnl: 300, equity: 600 },
        ]});
        setMistakesData({
          mistakes: [{ name: 'FOMO', count: 12 }, { name: 'Төлөвлөгөө дагаагүй', count: 8 }, { name: 'Stop Loss хөдөлгөсөн', count: 5 }],
          emotions: [{ name: 'Шунал', percentage: 30 }, { name: 'Айдас', percentage: 25 }, { name: 'Тэвчээргүй', percentage: 45 }],
        });
        setMode('mock');
      }
    } catch (err) {
      console.error(err);
      setError("Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, [timeRange, customRange, accountId]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // Refetch when any page mutates trade data (same tab or another tab)
  useTradesUpdated(fetchDashboardData);

  return (
    <div className="flex flex-col">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-8 h-16 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-white tracking-tight shrink-0">{t('analytics')}</h1>
        <div className="flex items-center gap-3 ml-auto">
          {/* Account dropdown */}
          <div className="relative">
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:border-accent cursor-pointer hover:border-slate-600 transition-colors"
            >
              <option value="all">Бүх данс</option>
              <option value="personal">Үндсэн данс</option>
              {mt5Accounts.map(a => (
                <option key={a.id} value={a.id}>{a.server} · {a.login}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
          </div>

          {/* Currency toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden text-xs">
            {['$', '₮'].map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-3 py-1.5 transition-colors ${currency === c ? 'bg-accent text-black font-semibold' : 'text-slate-400 hover:text-slate-300'}`}
              >
                {c}
              </button>
            ))}
          </div>

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

      {/* Main Scrollable Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <AnalyticsTabs activeTab={activeTab} onChange={setActiveTab} />

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}

          {!error && mode === 'mock' && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl text-sm flex items-center justify-between">
              <span>
                <strong>{t('previewMode')}:</strong> {t('previewModeDesc')}
              </span>
            </div>
          )}

          {!loading && !error && (!summary || !charts || summary.totalTrades === 0) && (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-800 rounded-xl text-slate-500 animate-in fade-in duration-300">
              <p className="text-lg font-medium text-white mb-2">{t('noDataTitle')}</p>
              <p className="text-sm">{t('noDataDesc')}</p>
            </div>
          )}

          {activeTab === "overview" && !loading && summary && charts && summary.totalTrades > 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Row 1: Summary Cards */}
              <SummaryCards data={summary} timeRange={timeRange} currency={currency} />

              {/* Row 2: Main Charts & AI */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <EquityChart data={charts.equityCurve} currency={currency} />
                  <TradeCalendar trades={trades} />
                </div>
                <div className="lg:col-span-1 flex flex-col gap-6">
                  <MyGoalPanel />
                  <AiInsightPanel />
                </div>
              </div>
            </div>
          )}

          {activeTab === "detailed" && !loading && summary && charts && summary.totalTrades > 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <PerformanceCharts timeRange={timeRange} accountId={accountId} currency={currency} />
            </div>
          )}

          {activeTab === "mistakes" && !loading && summary && summary.totalTrades > 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <AiInsightPanel />
                </div>
                <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col gap-4">
                  <h3 className="text-lg font-medium text-white">{t('psychMistakes')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-800 rounded-lg bg-slate-950/50 hover:border-accent/30 transition-colors">
                      <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        {t('commonMistakes')}
                      </h4>
                      <ul className="space-y-3 text-sm text-slate-400">
                        {mistakesData?.mistakes?.map((m, i) => (
                          <li key={i} className="flex justify-between items-center group">
                            <span className="group-hover:text-slate-300 transition-colors">{m.name}</span>
                            <span className="text-rose-400 font-medium bg-rose-400/10 px-2 py-0.5 rounded">{m.count} {t('timesCount')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 border border-slate-800 rounded-lg bg-slate-950/50 hover:border-accent/30 transition-colors">
                      <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-amber-400" />
                        {t('emotions')}
                      </h4>
                      <ul className="space-y-3 text-sm text-slate-400">
                        {mistakesData?.emotions?.map((e, i) => (
                          <li key={i} className="flex justify-between items-center group">
                            <span className="group-hover:text-slate-300 transition-colors">{e.name}</span>
                            <span className="text-amber-400 font-medium bg-amber-400/10 px-2 py-0.5 rounded">{e.percentage}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "calendar" && !loading && summary && summary.totalTrades > 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <TradeCalendar trades={trades} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
