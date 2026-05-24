import { useLang } from "@/contexts/LanguageContext";
import {
  BrainCircuit, TrendingDown, AlertCircle, CheckCircle2,
  Loader2, Activity, TrendingUp, ArrowUp, ArrowDown, Minus,
  Target, DollarSign, ShieldCheck, AlertTriangle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { analyticsService } from "@/services/analyticsService";
import { useTradesUpdated } from "@/lib/tradesSync";
import { TimeFilter } from "@/components/features/analytics/TimeFilter";
import { MARKET_TYPES } from "@/lib/constants";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

// ── Animated bar ──────────────────────────────────────────────────────────────
function AnimatedBar({ pct, gradient }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, iconBg, iconColor, label, value, sub, trend }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        {trend !== undefined && (
          <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${
            trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-slate-500'
          }`}>
            {trend > 0 ? <ArrowUp className="w-3 h-3" /> : trend < 0 ? <ArrowDown className="w-3 h-3" /> : null}
            {trend !== 0 ? `${Math.abs(trend)}%` : '—'}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white tracking-tight leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}

// ── Tag table row ─────────────────────────────────────────────────────────────
function TagRow({ item, rank, max, totalTrades, gradient, badgeColor, delta }) {
  const pct = Math.round((item.count / max) * 100);
  const tradePct = totalTrades > 0 ? Math.round((item.count / totalTrades) * 100) : 0;
  return (
    <div className="grid grid-cols-[28px_1fr_48px_48px_52px] gap-2 items-center py-2.5 px-3 -mx-3 rounded-xl hover:bg-slate-800/40 transition-colors">
      <span className="text-xs font-semibold text-slate-600 text-center">{rank}</span>
      <div className="min-w-0">
        <p className="text-sm text-slate-200 font-medium truncate mb-1.5">{item.name}</p>
        <AnimatedBar pct={pct} gradient={gradient} />
      </div>
      <span className={`text-xs font-semibold text-center px-1.5 py-0.5 rounded-md ${badgeColor}`}>{item.count}x</span>
      <span className="text-xs text-slate-400 text-center">{tradePct}%</span>
      <span className={`text-[11px] font-semibold flex items-center justify-end gap-0.5 ${
        delta === undefined ? 'invisible' :
        delta > 0 ? 'text-rose-400' : delta < 0 ? 'text-emerald-400' : 'text-slate-600'
      }`}>
        {delta !== undefined && delta > 0 && <ArrowUp className="w-2.5 h-2.5" />}
        {delta !== undefined && delta < 0 && <ArrowDown className="w-2.5 h-2.5" />}
        {delta !== undefined && delta === 0 && <Minus className="w-2.5 h-2.5" />}
        {delta !== undefined && delta !== 0 ? Math.abs(delta) : delta === 0 ? '—' : ''}
      </span>
    </div>
  );
}

// ── Emotion card ──────────────────────────────────────────────────────────────
function EmotionCard({ e }) {
  const positive = e.totalPnl >= 0;
  const accentColor = positive ? "#34d399" : "#f87171";
  return (
    <div
      className="group relative bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 hover:bg-slate-800/50 transition-all duration-200 overflow-hidden"
      style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${accentColor}08 0%, transparent 60%)` }}
      />
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-semibold text-white leading-snug pr-2">{e.name}</p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${positive ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
          {e.percentage}%
        </span>
      </div>
      <p className={`text-xl font-bold tracking-tight ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {positive ? '+' : ''}{e.totalPnl?.toFixed(2)}
      </p>
      <p className="text-xs text-slate-500 mt-0.5 mb-3">{e.count} арилжаа</p>
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wider">Win rate</p>
          <p className={`text-sm font-bold mt-0.5 ${(e.winRate || 0) >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {e.winRate ?? 0}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wider">Дундаж</p>
          <p className={`text-sm font-bold mt-0.5 ${(e.avgProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {(e.avgProfit || 0) >= 0 ? '+' : ''}{(e.avgProfit || 0).toFixed(1)}
          </p>
        </div>
      </div>
      <div className="mt-2.5">
        <AnimatedBar pct={e.percentage} gradient={positive ? "from-emerald-600 to-emerald-400" : "from-rose-600 to-rose-400"} />
      </div>
    </div>
  );
}

// ── Custom chart tooltip ──────────────────────────────────────────────────────
const BAR_COLORS = ['#f87171', '#fb923c', '#facc15', '#a78bfa', '#60a5fa'];

function WeeklyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shadow-2xl">
      <p className="text-[11px] text-slate-400 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-xs text-slate-300 truncate max-w-[120px]">{p.name}</span>
          <span className="text-xs font-bold text-white ml-auto">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function EmotionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shadow-2xl">
      <p className="text-xs text-slate-300 font-semibold">{label}</p>
      <p className={`text-sm font-bold mt-1 ${val >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {val >= 0 ? '+' : ''}{val.toFixed(2)}
      </p>
    </div>
  );
}

// ── AI recommendations generator ─────────────────────────────────────────────
function generateRecommendations(data) {
  if (!data) return { critical: [], improve: [], reinforce: [] };
  const critical = [], improve = [], reinforce = [];

  // Critical: top mistake
  if (data.mistakes[0]) {
    const top = data.mistakes[0];
    critical.push({
      icon: '🚨',
      title: top.name,
      desc: `Та "${top.name}" алдааг ${top.count} удаа давтсан байна. Энэ нь хамгийн нөлөөтэй алдаа тул арилжааны өмнө тусгайлан анхаарал хандуулаарай.`,
      action: 'TP хүрхтэл төлөвлөгөөгөө баримтал.',
    });
  }

  // Critical: worst emotion
  const worstEmo = [...(data.emotions || [])]
    .filter(e => e.totalPnl < 0)
    .sort((a, b) => a.totalPnl - b.totalPnl)[0];
  if (worstEmo) {
    critical.push({
      icon: worstEmo.name.split(' ')[0],
      title: `${worstEmo.name} — алдагдалтай холбоотой`,
      desc: `Та "${worstEmo.name}" сэтгэл зүйтэй байхдаа нийт ${Math.abs(worstEmo.totalPnl).toFixed(0)}$ алдагдал хүлээж байна.`,
      action: 'Хэт сандарч байх үед арилжаанд орохоос зайлсхий.',
    });
  }

  // Improve: stop loss
  const noSl = data.mistakes.find(m => m.name.toLowerCase().includes('stop loss') || m.name.toLowerCase().includes('sl'));
  if (noSl) {
    improve.push({
      icon: '⚠️',
      title: noSl.name,
      desc: `${noSl.count} удаа SL тавиагүй арилжаанд орсон байна. Энэ нь алдагдлын эрсдлийг ихэсгэх шалтгаан болдог.`,
      action: "SL-ийг урьдчилан тогтоо, хөдөлгөхгүй байх.",
    });
  }

  // Improve: stressed emotion if not already in critical
  const stressedEmo = (data.emotions || []).find(e =>
    e.name.toLowerCase().includes('стресс') || e.name.toLowerCase().includes('stressed')
  );
  if (stressedEmo && stressedEmo !== worstEmo && stressedEmo.winRate < 50) {
    improve.push({
      icon: '😵',
      title: `Стресстэй үед арилжаа хийх`,
      desc: `Стресстэй үед арилжаа хийх нь алдагдлын магадлалыг нэмэгдүүлдэг.`,
      action: 'Стресс өндөр үед амрах эсвэл сешн зогсоо.',
    });
  }

  // Improve: if mistakes >> positives
  const mTotal = data.mistakes.reduce((s, m) => s + m.count, 0);
  const pTotal = data.positiveTags.reduce((s, t) => s + t.count, 0);
  if (mTotal > pTotal * 1.5 && mTotal > 0) {
    improve.push({
      icon: '📊',
      title: 'Алдаа давуу талаас илүү байна',
      desc: `Алдааны тоо (${mTotal}) нь давуу талаас (${pTotal}) хамаагүй их байна.`,
      action: 'Эерэг зан чанаруудаа илүү анхаарч, ялалтаа дүн шинжилгээ хий.',
    });
  }

  // Reinforce: best emotion
  const bestEmo = [...(data.emotions || [])]
    .filter(e => e.totalPnl > 0)
    .sort((a, b) => b.totalPnl - a.totalPnl)[0];
  if (bestEmo) {
    reinforce.push({
      icon: bestEmo.name.split(' ')[0] || '✅',
      title: `${bestEmo.name} — хамгийн ашигтай төлөв`,
      desc: `Та "${bestEmo.name}" үед нийт +${bestEmo.totalPnl.toFixed(0)}$ ашиг олж байна (${bestEmo.count} арилжаа).`,
      action: 'Төлөвлөгөөгөө сайн дагаж, итгэлтэй орсон.',
    });
  }

  // Reinforce: top positive tag
  if (data.positiveTags[0]) {
    const top = data.positiveTags[0];
    reinforce.push({
      icon: '✅',
      title: top.name,
      desc: `"${top.name}" ${top.count} удаа бүртгэгдсэн — энэ тань гол давуу тал.`,
      action: 'RR харьцааг сайн баримталж байна.',
    });
  }

  return { critical, improve, reinforce };
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function MistakesPage() {
  const { t } = useLang();
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [timeRange, setTimeRange]     = useState('all');
  const [customRange, setCustomRange] = useState(null);
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [histPrev, setHistPrev]       = useState(null);

  const fetchMistakes = useCallback(() => {
    setLoading(true);
    analyticsService.getMistakes(timeRange)
      .then(res => {
        if (res.success) setData(res.data);
        else setError(res.error || "Алдаа гарлаа");
      })
      .catch(() => setError("Сервертэй холбогдоход алдаа гарлаа."))
      .finally(() => setLoading(false));
  }, [timeRange]);

  useEffect(() => {
    const prevRange = { all: '1y', '1y': '3m', '6m': '3m', '3m': '1m', '1m': '7d', '7d': 'today', today: 'today' };
    const prev = prevRange[timeRange] || '1m';
    if (prev !== timeRange) {
      analyticsService.getMistakes(prev)
        .then(res => { if (res.success) setHistPrev(res.data); })
        .catch(() => {});
    } else {
      setHistPrev(null);
    }
  }, [timeRange]);

  useEffect(() => { fetchMistakes(); }, [fetchMistakes]);
  useTradesUpdated(fetchMistakes);

  const recs = data ? generateRecommendations(data) : { critical: [], improve: [], reinforce: [] };
  const summary = data?.summary;
  const weeklyChart = data?.weeklyChart || [];
  const top3Names = weeklyChart.length > 0
    ? Object.keys(weeklyChart[0]).filter(k => k !== 'week')
    : [];

  // Emotion bar chart data
  const emotionChartData = (data?.emotions || []).map(e => ({
    name: e.name.split(' ').slice(0, 2).join(' '),
    value: parseFloat((e.totalPnl || 0).toFixed(2)),
  }));

  return (
    <div className="p-6 lg:p-8 max-w-[1280px] mx-auto w-full flex flex-col gap-6 animate-page-enter">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-4.5 h-4.5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Алдаа & Сэтгэл зүй</h1>
            <p className="text-sm text-slate-500 mt-0.5">Арилжааны алдаа болон сэтгэл зүйн төлөв байдлын анализ</p>
          </div>
        </div>
        {data && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 shrink-0">
            <Activity className="w-3.5 h-3.5 text-accent" />
            <span>{data.totalTrades} арилжаа</span>
          </div>
        )}
      </div>

      {/* ── Шүүлтүүр ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <TimeFilter
            value={timeRange}
            onChange={setTimeRange}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[{ id: 'all', label: 'Бүх зах зээл' }, ...MARKET_TYPES].map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMarket(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                selectedMarket === m.id
                  ? 'bg-accent/15 border-accent/40 text-accent'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading / Error / Empty ──────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center h-64 gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 text-accent animate-spin" />
          <span className="text-sm">Өгөгдөл уншиж байна...</span>
        </div>
      ) : error ? (
        <div className="bg-rose-500/8 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">{error}</div>
      ) : !data || data.totalTrades === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-300">Дата олдсонгүй</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">Арилжаа нэмэхдээ Сэтгэл зүй & Таг хэсгээс сэтгэл зүй болон алдааны таг сонгоорой.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">

          {/* ── Summary cards ───────────────────────────────────────────────── */}
          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <SummaryCard
                icon={Target}
                iconBg="bg-emerald-500/10"
                iconColor="text-emerald-400"
                label="Win Rate"
                value={`${summary.winRate}%`}
                sub={`${summary.winCount} wins / ${data.totalTrades} trades`}
              />
              <SummaryCard
                icon={DollarSign}
                iconBg={summary.totalPnl >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"}
                iconColor={summary.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}
                label="Нийт ашиг/алдагдал"
                value={`${summary.totalPnl >= 0 ? '+' : ''}$${Math.abs(summary.totalPnl).toFixed(0)}`}
                sub={`Нийт ${data.totalTrades} арилжаа`}
              />
              <SummaryCard
                icon={TrendingUp}
                iconBg={summary.avgProfit >= 0 ? "bg-blue-500/10" : "bg-rose-500/10"}
                iconColor={summary.avgProfit >= 0 ? "text-blue-400" : "text-rose-400"}
                label="Дундаж ашиг"
                value={`${summary.avgProfit >= 0 ? '+' : ''}$${Math.abs(summary.avgProfit).toFixed(2)}`}
                sub="Нэг арилжаанд"
              />
              <SummaryCard
                icon={ShieldCheck}
                iconBg="bg-amber-500/10"
                iconColor="text-amber-400"
                label="Сахилга бат (Score)"
                value={`${summary.disciplineScore}`}
                sub="/100 дундаж түвшин"
              />
              {data.topMistake && (
                <div className="bg-slate-900 border border-rose-500/20 rounded-2xl p-4 flex flex-col gap-2 lg:col-span-1 col-span-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <p className="text-xs font-semibold text-slate-400">Хамгийн их давтагдсан алдаа</p>
                  </div>
                  <p className="text-base font-bold text-rose-300 leading-tight">{data.topMistake.name}</p>
                  <p className="text-xs text-slate-500">{data.topMistake.count} удаа ({summary.totalTrades > 0 ? Math.round((data.topMistake.count / data.totalTrades) * 100) : 0}%)</p>
                </div>
              )}
            </div>
          )}

          {/* ── Алдаа + Давуу тал ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Алдаа */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-white">{t('topMistakesTitle')}</h2>
                </div>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md">
                  {data.mistakes.length} таг
                </span>
              </div>
              {data.mistakes.length === 0 ? (
                <p className="text-slate-600 text-sm py-4 text-center">Алдааны таг бүртгэгдээгүй байна.</p>
              ) : (
                <>
                  {/* Column headers */}
                  <div className="grid grid-cols-[28px_1fr_48px_48px_52px] gap-2 px-3 mb-1">
                    <span />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Алдаа</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center">Тоо</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center">Хувь</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-right">Өмнөхөөс</span>
                  </div>
                  {data.mistakes.map((m, i) => {
                    const prev = histPrev?.mistakes?.find(x => x.name === m.name);
                    return (
                      <TagRow
                        key={i} item={m} rank={i + 1}
                        max={data.mistakes[0].count}
                        totalTrades={data.totalTrades}
                        gradient="from-rose-600 to-rose-400"
                        badgeColor="bg-rose-500/10 text-rose-400"
                        delta={prev !== undefined ? m.count - prev.count : undefined}
                      />
                    );
                  })}
                  {histPrev && (
                    <p className="text-xs text-rose-400/70 mt-2 flex items-center gap-1.5">
                      <ArrowUp className="w-3 h-3" />
                      Өмнөх 7 хоноготой харьцуулалт
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Давуу тал */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-white">{t('positiveTagsTitle')}</h2>
                </div>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md">
                  {data.positiveTags.length} таг
                </span>
              </div>
              {data.positiveTags.length === 0 ? (
                <p className="text-slate-600 text-sm py-4 text-center">Давуу талын таг бүртгэгдээгүй байна.</p>
              ) : (
                <>
                  <div className="grid grid-cols-[28px_1fr_48px_48px_52px] gap-2 px-3 mb-1">
                    <span />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Давуу тал</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center">Тоо</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center">Хувь</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-right">Өмнөхөөс</span>
                  </div>
                  {data.positiveTags.map((tag, i) => {
                    const prev = histPrev?.positiveTags?.find(x => x.name === tag.name);
                    return (
                      <TagRow
                        key={i} item={tag} rank={i + 1}
                        max={data.positiveTags[0].count}
                        totalTrades={data.totalTrades}
                        gradient="from-emerald-600 to-emerald-400"
                        badgeColor="bg-emerald-500/10 text-emerald-400"
                        delta={prev !== undefined ? tag.count - prev.count : undefined}
                      />
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* ── Сэтгэл зүйн нөлөөлөл (Эмоушн ↔ Үр дүн) ─────────────────────── */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Сэтгэл зүйн нөлөөлөл (Эмоушн ↔ Үр дүн)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Арилжааны өмнөх сэтгэл зүй болон ашиг/алдагдлын хамаарал</p>
                </div>
              </div>
              <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md shrink-0">
                {data.emotions.length} сэтгэл зүй
              </span>
            </div>
            {data.emotions.length === 0 ? (
              <p className="text-slate-600 text-sm py-4 text-center">Сэтгэл зүйн таг бүртгэгдээгүй байна.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {data.emotions.map((e, i) => <EmotionCard key={i} e={e} />)}
              </div>
            )}
          </div>

          {/* ── 2 Charts ─────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Weekly mistake frequency */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Алдааны давтамж (түүхэн)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Долоо хоногоор</p>
                </div>
              </div>
              {weeklyChart.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-slate-600 text-xs">
                  Хангалттай дата байхгүй байна
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={weeklyChart} barSize={14} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} interval={0} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<WeeklyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      {top3Names.map((name, i) => (
                        <Bar key={name} dataKey={name} fill={BAR_COLORS[i % BAR_COLORS.length]} radius={[3, 3, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 mt-3">
                    {top3Names.map((name, i) => (
                      <div key={name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                        <span className="text-[11px] text-slate-400 truncate max-w-[100px]">{name}</span>
                      </div>
                    ))}
                  </div>
                  {histPrev && (
                    <p className="text-xs text-rose-400/70 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {(() => {
                        const topName = top3Names[0];
                        const lastWeek = weeklyChart[weeklyChart.length - 1];
                        if (topName && lastWeek) {
                          return `"${topName}" алдааны давтамж сүүлийн долоо хонгоор ${lastWeek[topName] > 0 ? 'ессэн' : 'бага'} байна.`;
                        }
                        return '';
                      })()}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Chart 2: Emotion vs PnL */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Эмоушн vs Ашиг/Алдагдал</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Баганан график</p>
                </div>
              </div>
              {emotionChartData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-slate-600 text-xs">
                  Сэтгэл зүйн дата байхгүй байна
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={emotionChartData} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <ReferenceLine y={0} stroke="#334155" />
                      <Tooltip content={<EmotionTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {emotionChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.value >= 0 ? '#34d399' : '#f87171'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                    {emotionChartData.some(e => e.value > 0)
                      ? `✅ Зарим сэтгэл зүйтэй үед дундаж ашиг өндөр байна.`
                      : `⚠️ Сэтгэл зүйг удирдаж, ашигтай нөхцөлд л арилжаанд ор.`
                    }
                  </p>
                </>
              )}
            </div>
          </div>

          {/* ── AI зөвлөмжүүд — 3 хэсэг ─────────────────────────────────────── */}
          {(recs.critical.length > 0 || recs.improve.length > 0 || recs.reinforce.length > 0) && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                    <BrainCircuit className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">AI зөвлөмжүүд</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Таны өгөгдөлд суурилсан зөвлөмж</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 shrink-0">Сүүлийн шинэчлэлт: Өнөөдөр {new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Critical */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-rose-500/20">
                    <span className="text-base">🔴</span>
                    <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Анхаарах зүйлс (Critical)</p>
                    {recs.critical.length > 0 && (
                      <span className="ml-auto text-[10px] font-bold bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full">{recs.critical.length}</span>
                    )}
                  </div>
                  {recs.critical.length === 0 ? (
                    <p className="text-xs text-slate-600 py-3 text-center">Одоогоор критик зүйл байхгүй 🎉</p>
                  ) : recs.critical.map((rec, i) => (
                    <div key={i} className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-3.5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{rec.icon}</span>
                        <p className="text-sm font-semibold text-rose-300 leading-tight">{rec.title}</p>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-2">{rec.desc}</p>
                      {rec.action && (
                        <p className="text-xs text-rose-400/80 font-medium">
                          <span className="text-rose-500">Юу хийх вэ?</span> {rec.action}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Improve */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-amber-500/20">
                    <span className="text-base">🟡</span>
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Сайжруулах зүйлс (Improve)</p>
                    {recs.improve.length > 0 && (
                      <span className="ml-auto text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">{recs.improve.length}</span>
                    )}
                  </div>
                  {recs.improve.length === 0 ? (
                    <p className="text-xs text-slate-600 py-3 text-center">Сайжруулах зүйл олдсонгүй ✨</p>
                  ) : recs.improve.map((rec, i) => (
                    <div key={i} className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{rec.icon}</span>
                        <p className="text-sm font-semibold text-amber-300 leading-tight">{rec.title}</p>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-2">{rec.desc}</p>
                      {rec.action && (
                        <p className="text-xs text-amber-400/80 font-medium">
                          <span className="text-amber-500">Юу хийх вэ?</span> {rec.action}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Reinforce */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-emerald-500/20">
                    <span className="text-base">🟢</span>
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Хүчтэй тал (Reinforce)</p>
                    {recs.reinforce.length > 0 && (
                      <span className="ml-auto text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">{recs.reinforce.length}</span>
                    )}
                  </div>
                  {recs.reinforce.length === 0 ? (
                    <p className="text-xs text-slate-600 py-3 text-center">Давуу тал бүртгэгдээгүй байна</p>
                  ) : recs.reinforce.map((rec, i) => (
                    <div key={i} className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{rec.icon}</span>
                        <p className="text-sm font-semibold text-emerald-300 leading-tight">{rec.title}</p>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-2">{rec.desc}</p>
                      {rec.action && (
                        <p className="text-xs text-emerald-400/80 font-medium">
                          <span className="text-emerald-500">Юу сайн байна вэ?</span> {rec.action}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
