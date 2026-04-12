import { useState, useEffect } from "react";
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
import { AlertTriangle, Brain } from "lucide-react";

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("7d");
  const [customRange, setCustomRange] = useState(null);
  
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [mistakesData, setMistakesData] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('database');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        if (timeRange === 'custom' && (!customRange || !customRange.start || !customRange.end)) {
          setLoading(false);
          return;
        }

        const fetchRange = timeRange === 'custom' ? `${customRange.start}_${customRange.end}` : timeRange;
        
        const [summaryRes, chartsRes, mistakesRes, tradesRes] = await Promise.all([
          analyticsService.getSummary(fetchRange),
          analyticsService.getCharts(fetchRange),
          analyticsService.getMistakes(fetchRange),
          tradeService.getTrades()
        ]);

        if (summaryRes.success && chartsRes.success) {
          setSummary(summaryRes.data);
          setCharts(chartsRes.data);
          if (mistakesRes.success) setMistakesData(mistakesRes.data);
          if (tradesRes.success) setTrades(tradesRes.data);
          if (summaryRes.mode === 'mock') setMode('mock');
        } else {
          console.warn("Backend failed, using frontend fallback mock data");
          setSummary({
            netPnl: 1250.50,
            winRate: 64.5,
            profitFactor: 1.8,
            totalTrades: 42
          });
          setCharts({
            equityCurve: [
              { date: '2023-10-01', pnl: 100, equity: 100 },
              { date: '2023-10-05', pnl: -50, equity: 50 },
              { date: '2023-10-10', pnl: 200, equity: 250 },
              { date: '2023-10-15', pnl: 150, equity: 400 },
              { date: '2023-10-20', pnl: -100, equity: 300 },
              { date: '2023-10-25', pnl: 300, equity: 600 },
            ]
          });
          setMistakesData({
            mistakes: [
              { name: 'FOMO', count: 12 },
              { name: 'Төлөвлөгөө дагаагүй', count: 8 },
              { name: 'Stop Loss хөдөлгөсөн', count: 5 }
            ],
            emotions: [
              { name: 'Шунал', percentage: 30 },
              { name: 'Айдас', percentage: 25 },
              { name: 'Тэвчээргүй', percentage: 45 }
            ]
          });
          setMode('mock');
        }
      } catch (err) {
        console.error(err);
        setError("Сервертэй холбогдоход алдаа гарлаа.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange, customRange]);

  return (
    <div className="flex flex-col flex-1">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-8 h-16 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white tracking-tight">Анализ</h1>
        <TimeFilter 
          value={timeRange} 
          onChange={setTimeRange} 
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
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
                <strong>Preview Mode:</strong> PostgreSQL өгөгдлийн сантай холбогдож чадсангүй. Одоогоор Mock (жишээ) дата ашиглаж байна.
              </span>
            </div>
          )}

          {!loading && !error && (!summary || !charts || summary.totalTrades === 0) && (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-800 rounded-xl text-slate-500 animate-in fade-in duration-300">
              <p className="text-lg font-medium text-white mb-2">Мэдээлэл олдсонгүй</p>
              <p className="text-sm">Сонгосон хугацаанд хамаарах өгөгдөл байхгүй байна.</p>
            </div>
          )}

          {activeTab === "overview" && !loading && summary && charts && summary.totalTrades > 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Row 1: Summary Cards */}
              <SummaryCards data={summary} />

              {/* Row 2: Main Charts & AI */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <EquityChart data={charts.equityCurve} />
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
              <PerformanceCharts timeRange={timeRange} />
            </div>
          )}

          {activeTab === "mistakes" && !loading && summary && summary.totalTrades > 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <AiInsightPanel />
                </div>
                <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col gap-4">
                  <h3 className="text-lg font-medium text-white">Сэтгэл зүй & Алдаа</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-800 rounded-lg bg-slate-950/50 hover:border-accent/30 transition-colors">
                      <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        Түгээмэл алдаанууд
                      </h4>
                      <ul className="space-y-3 text-sm text-slate-400">
                        {mistakesData?.mistakes?.map((m, i) => (
                          <li key={i} className="flex justify-between items-center group">
                            <span className="group-hover:text-slate-300 transition-colors">{m.name}</span>
                            <span className="text-rose-400 font-medium bg-rose-400/10 px-2 py-0.5 rounded">{m.count} удаа</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 border border-slate-800 rounded-lg bg-slate-950/50 hover:border-accent/30 transition-colors">
                      <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-amber-400" />
                        Сэтгэл хөдлөл
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
