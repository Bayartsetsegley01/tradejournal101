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
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

// Өмнөх үеийн мужийг тооцоолно (ижил урттай)
function computePrevRange(range) {
  if (!range || range === 'all' || range === 'today' || range === 'custom') return null;
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  if (range === '7d') { end.setDate(now.getDate() - 7); start.setDate(now.getDate() - 14); }
  else if (range === '1m') { end.setMonth(now.getMonth() - 1); start.setMonth(now.getMonth() - 2); }
  else if (range === '3m') { end.setMonth(now.getMonth() - 3); start.setMonth(now.getMonth() - 6); }
  else if (range === '6m') { end.setMonth(now.getMonth() - 6); start.setFullYear(now.getFullYear() - 1); }
  else if (range === '1y') { end.setFullYear(now.getFullYear() - 1); start.setFullYear(now.getFullYear() - 2); }
  else return null;
  return `${start.toISOString().slice(0, 10)}_${end.toISOString().slice(0, 10)}`;
}

// ── Animated bar ──────────────────────────────────────────────────────────────
function AnimatedBar({ pct, gradient }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="relative bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.02) 0%, transparent 70%)' }} />
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white tracking-tight leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}

// ── Tag row ───────────────────────────────────────────────────────────────────
function TagRow({ item, rank, max, totalTrades, gradient, badgeColor, delta, showDelta }) {
  const pct = Math.round((item.count / max) * 100);
  const tradePct = totalTrades > 0 ? Math.round((item.count / totalTrades) * 100) : 0;
  return (
    <div className={`grid items-center py-2.5 px-3 -mx-3 rounded-xl hover:bg-slate-800/40 transition-colors ${
      showDelta ? 'grid-cols-[28px_1fr_44px_44px_52px]' : 'grid-cols-[28px_1fr_44px_44px]'
    } gap-2`}>
      <span className="text-xs font-semibold text-slate-600 text-center">{rank}</span>
      <div className="min-w-0">
        <p className="text-sm text-slate-200 font-medium truncate mb-1.5">{item.name}</p>
        <AnimatedBar pct={pct} gradient={gradient} />
      </div>
      <span className={`text-xs font-semibold text-center px-1.5 py-0.5 rounded-md ${badgeColor}`}>{item.count}x</span>
      <span className="text-xs text-slate-400 text-center">{tradePct}%</span>
      {showDelta && (
        <span className={`text-[11px] font-semibold flex items-center justify-end gap-0.5 ${
          delta === undefined ? 'invisible' :
          delta > 0 ? 'text-rose-400' : delta < 0 ? 'text-emerald-400' : 'text-slate-600'
        }`}>
          {delta !== undefined && delta > 0 && <ArrowUp className="w-2.5 h-2.5" />}
          {delta !== undefined && delta < 0 && <ArrowDown className="w-2.5 h-2.5" />}
          {delta !== undefined && delta === 0 && <Minus className="w-2.5 h-2.5" />}
          {delta !== undefined && delta !== 0 ? Math.abs(delta) : delta === 0 ? '—' : ''}
        </span>
      )}
    </div>
  );
}

// ── Emotion card ──────────────────────────────────────────────────────────────
function EmotionCard({ e }) {
  const positive = e.totalPnl >= 0;
  const accentColor = positive ? '#34d399' : '#f87171';
  const bgGlow = positive ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)';
  return (
    <div
      className="group relative bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-200 overflow-hidden cursor-default"
      style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}
    >
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{ background: `radial-gradient(ellipse at top left, ${bgGlow} 0%, transparent 60%)` }} />
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-semibold text-white leading-snug pr-2 truncate">{e.name}</p>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${positive ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
          {e.percentage}%
        </span>
      </div>
      <p className={`text-xl font-bold tracking-tight ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {positive ? '+' : ''}{e.totalPnl?.toFixed(2)}
      </p>
      <p className="text-[11px] text-slate-500 mt-0.5 mb-3">{e.count} арилжаа</p>
      <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-800/80">
        <div>
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Win rate</p>
          <p className={`text-sm font-bold ${(e.winRate || 0) >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {e.winRate ?? 0}%
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Дундаж</p>
          <p className={`text-sm font-bold ${(e.avgProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {(e.avgProfit || 0) >= 0 ? '+' : ''}{(e.avgProfit || 0).toFixed(1)}
          </p>
        </div>
      </div>
      <div className="mt-2.5">
        <AnimatedBar pct={e.percentage} gradient={positive ? 'from-emerald-600 to-emerald-400' : 'from-rose-600 to-rose-400'} />
      </div>
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function EmotionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div className="bg-slate-800/95 border border-slate-700/80 rounded-xl px-3.5 py-2.5 shadow-2xl backdrop-blur-sm">
      <p className="text-xs text-slate-400 mb-1 truncate max-w-[180px]">{label}</p>
      <p className={`text-base font-bold ${val >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {val >= 0 ? '+' : ''}${val.toFixed(2)}
      </p>
    </div>
  );
}

// ── AI recommendations ─────────────────────────────────────────────────────────
function generateRecommendations(data) {
  if (!data) return { critical: [], improve: [], reinforce: [] };
  const critical = [], improve = [], reinforce = [];

  if (data.mistakes[0]) {
    const top = data.mistakes[0];
    critical.push({
      title: top.name,
      desc: `"${top.name}" алдааг ${top.count} удаа давтсан байна. Хамгийн нөлөөтэй алдаа тул арилжааны өмнө тусгайлан анхаарал хандуулаарай.`,
      action: 'TP хүрхтэл төлөвлөгөөгөө баримтал.',
    });
  }

  const worstEmo = [...(data.emotions || [])].filter(e => e.totalPnl < 0).sort((a, b) => a.totalPnl - b.totalPnl)[0];
  if (worstEmo) {
    critical.push({
      title: `${worstEmo.name} — алдагдалтай холбоотой`,
      desc: `"${worstEmo.name}" үед нийт ${Math.abs(worstEmo.totalPnl).toFixed(0)}$ алдагдал хүлээж байна.`,
      action: 'Энэ сэтгэл зүйтэй үед арилжаанаас зайлсхий.',
    });
  }

  const noSl = data.mistakes.find(m => m.name.toLowerCase().includes('stop') || m.name.toLowerCase().includes('sl'));
  if (noSl) {
    improve.push({
      title: noSl.name,
      desc: `${noSl.count} удаа давтагдсан байна. Алдагдлын эрсдлийг ихэсгэх шалтгаан болдог.`,
      action: 'SL-ийг урьдчилан тогтоо, хөдөлгөхгүй байх.',
    });
  }

  const mTotal = data.mistakes.reduce((s, m) => s + m.count, 0);
  const pTotal = data.positiveTags.reduce((s, t) => s + t.count, 0);
  if (mTotal > pTotal * 1.5 && mTotal > 0) {
    improve.push({
      title: 'Алдаа давуу талаас илүү байна',
      desc: `Алдааны тоо (${mTotal}) нь давуу талаас (${pTotal}) хамаагүй их байна.`,
      action: 'Эерэг зан чанараа илүү тэмдэглэж, ялалтаа дүн шинжилгээ хий.',
    });
  }

  const bestEmo = [...(data.emotions || [])].filter(e => e.totalPnl > 0).sort((a, b) => b.totalPnl - a.totalPnl)[0];
  if (bestEmo) {
    reinforce.push({
      title: `${bestEmo.name} — хамгийн ашигтай төлөв`,
      desc: `"${bestEmo.name}" үед нийт +${bestEmo.totalPnl.toFixed(0)}$ ашиг олж байна (${bestEmo.count} арилжаа).`,
      action: 'Зөвхөн ийм төлөвт арилжаанд орохыг хичээ.',
    });
  }

  if (data.positiveTags[0]) {
    const top = data.positiveTags[0];
    reinforce.push({
      title: top.name,
      desc: `"${top.name}" ${top.count} удаа бүртгэгдсэн. Энэ тань гол давуу тал.`,
      action: 'Бүх арилжаандаа энэ зан чанараа хэвийн болго.',
    });
  }

  return { critical, improve, reinforce };
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, iconBg, iconColor, title, badge }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
      </div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {badge !== undefined && (
        <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md shrink-0">{badge}</span>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function MistakesPage() {
  const { t } = useLang();
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [timeRange, setTimeRange]     = useState('all');
  const [customRange, setCustomRange] = useState(null);
  const [histPrev, setHistPrev]       = useState(null);

  const fetchMistakes = useCallback(() => {
    setLoading(true);
    analyticsService.getMistakes(timeRange)
      .then(res => {
        if (res.success) setData(res.data);
        else setError(res.error || 'Алдаа гарлаа');
      })
      .catch(() => setError('Сервертэй холбогдоход алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }, [timeRange]);

  // Өмнөх ижил хугацааны дата — жинхэнэ харьцуулалт
  useEffect(() => {
    const prevRange = computePrevRange(timeRange);
    if (prevRange) {
      analyticsService.getMistakes(prevRange)
        .then(res => { if (res.success) setHistPrev(res.data); else setHistPrev(null); })
        .catch(() => setHistPrev(null));
    } else {
      setHistPrev(null);
    }
  }, [timeRange]);

  useEffect(() => { fetchMistakes(); }, [fetchMistakes]);
  useTradesUpdated(fetchMistakes);

  const recs        = data ? generateRecommendations(data) : { critical: [], improve: [], reinforce: [] };
  const summary     = data?.summary;
  const showDelta   = !!histPrev;

  const top5Mistakes  = (data?.mistakes     || []).slice(0, 5);
  const top5Positive  = (data?.positiveTags || []).slice(0, 5);

  const emotionChartData = (data?.emotions || []).map(e => ({
    name: e.name.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim(),
    fullName: e.name,
    value: parseFloat((e.totalPnl || 0).toFixed(2)),
  }));

  const hasRecs = recs.critical.length + recs.improve.length + recs.reinforce.length > 0;

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

      {/* ── Хугацааны шүүлтүүр ──────────────────────────────────────────────── */}
      <div>
        <TimeFilter
          value={timeRange}
          onChange={setTimeRange}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
          align="left"
        />
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <SummaryCard
                icon={Target}
                iconBg="bg-emerald-500/10"
                iconColor="text-emerald-400"
                label="Win Rate"
                value={`${summary.winRate}%`}
                sub={`${summary.winCount} ялалт / ${data.totalTrades} арилжаа`}
              />
              <SummaryCard
                icon={DollarSign}
                iconBg={summary.totalPnl >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}
                iconColor={summary.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}
                label="Нийт ашиг/алдагдал"
                value={`${summary.totalPnl >= 0 ? '+' : ''}$${Math.abs(summary.totalPnl).toFixed(0)}`}
                sub={`Нийт ${data.totalTrades} арилжаа`}
              />
              <SummaryCard
                icon={TrendingUp}
                iconBg={summary.avgProfit >= 0 ? 'bg-blue-500/10' : 'bg-rose-500/10'}
                iconColor={summary.avgProfit >= 0 ? 'text-blue-400' : 'text-rose-400'}
                label="Дундаж ашиг"
                value={`${summary.avgProfit >= 0 ? '+' : ''}$${Math.abs(summary.avgProfit).toFixed(2)}`}
                sub="Нэг арилжаанд"
              />
              <SummaryCard
                icon={ShieldCheck}
                iconBg="bg-amber-500/10"
                iconColor="text-amber-400"
                label="Сахилга бат"
                value={`${summary.disciplineScore}`}
                sub="/100 оноо"
              />
            </div>
          )}

          {/* ── Хамгийн их давтагдсан алдаа (summary дотор) ────────────────── */}
          {data.topMistake && summary && (
            <div className="flex items-center gap-3 bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-xs text-slate-400">Хамгийн их давтагдсан алдаа:</span>
              <span className="text-sm font-semibold text-rose-300">{data.topMistake.name}</span>
              <span className="text-xs text-slate-500 ml-auto">{data.topMistake.count} удаа ({data.totalTrades > 0 ? Math.round((data.topMistake.count / data.totalTrades) * 100) : 0}%)</span>
            </div>
          )}

          {/* ── Алдаа + Давуу тал (top 5) ───────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Алдааны хүснэгт */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <SectionHeader
                icon={AlertCircle}
                iconBg="bg-rose-500/10"
                iconColor="text-rose-400"
                title={t('topMistakesTitle')}
                badge={`${data.mistakes.length} таг`}
              />
              {top5Mistakes.length === 0 ? (
                <p className="text-slate-600 text-sm py-6 text-center">Алдааны таг бүртгэгдээгүй байна.</p>
              ) : (
                <>
                  <div className={`grid gap-2 px-3 mb-2 ${showDelta ? 'grid-cols-[28px_1fr_44px_44px_52px]' : 'grid-cols-[28px_1fr_44px_44px]'}`}>
                    <span />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Алдаа</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center">Тоо</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center">Хувь</span>
                    {showDelta && <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-right">Өмнөхөөс</span>}
                  </div>
                  {top5Mistakes.map((m, i) => {
                    const prev = histPrev?.mistakes?.find(x => x.name === m.name);
                    return (
                      <TagRow
                        key={i} item={m} rank={i + 1}
                        max={top5Mistakes[0].count}
                        totalTrades={data.totalTrades}
                        gradient="from-rose-600 to-rose-400"
                        badgeColor="bg-rose-500/10 text-rose-400"
                        delta={prev !== undefined ? m.count - prev.count : undefined}
                        showDelta={showDelta}
                      />
                    );
                  })}
                  {data.mistakes.length > 5 && (
                    <p className="text-[11px] text-slate-600 text-center mt-2">+{data.mistakes.length - 5} нэмэлт таг</p>
                  )}
                </>
              )}
            </div>

            {/* Давуу талын хүснэгт */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <SectionHeader
                icon={CheckCircle2}
                iconBg="bg-emerald-500/10"
                iconColor="text-emerald-400"
                title={t('positiveTagsTitle')}
                badge={`${data.positiveTags.length} таг`}
              />
              {top5Positive.length === 0 ? (
                <p className="text-slate-600 text-sm py-6 text-center">Давуу талын таг бүртгэгдээгүй байна.</p>
              ) : (
                <>
                  <div className={`grid gap-2 px-3 mb-2 ${showDelta ? 'grid-cols-[28px_1fr_44px_44px_52px]' : 'grid-cols-[28px_1fr_44px_44px]'}`}>
                    <span />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Давуу тал</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center">Тоо</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center">Хувь</span>
                    {showDelta && <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-right">Өмнөхөөс</span>}
                  </div>
                  {top5Positive.map((tag, i) => {
                    const prev = histPrev?.positiveTags?.find(x => x.name === tag.name);
                    return (
                      <TagRow
                        key={i} item={tag} rank={i + 1}
                        max={top5Positive[0].count}
                        totalTrades={data.totalTrades}
                        gradient="from-emerald-600 to-emerald-400"
                        badgeColor="bg-emerald-500/10 text-emerald-400"
                        delta={prev !== undefined ? tag.count - prev.count : undefined}
                        showDelta={showDelta}
                      />
                    );
                  })}
                  {data.positiveTags.length > 5 && (
                    <p className="text-[11px] text-slate-600 text-center mt-2">+{data.positiveTags.length - 5} нэмэлт таг</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Сэтгэл зүй ──────────────────────────────────────────────────── */}
          {data.emotions.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <SectionHeader
                icon={TrendingDown}
                iconBg="bg-amber-500/10"
                iconColor="text-amber-400"
                title="Сэтгэл зүй"
                badge={`${data.emotions.length} төлөв`}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {data.emotions.map((e, i) => <EmotionCard key={i} e={e} />)}
              </div>
            </div>
          )}

          {/* ── Сэтгэл зүй vs А/А График ─────────────────────────────────────── */}
          {emotionChartData.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-white">Сэтгэл зүй — Ашиг/Алдагдалд үзүүлэх нөлөө</h2>
                </div>
                <span className="text-xs text-slate-500">{emotionChartData.length} сэтгэл зүй</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={emotionChartData}
                  barSize={emotionChartData.length > 6 ? 20 : 28}
                  barGap={4}
                  margin={{ top: 12, right: 4, left: -18, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#334155' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `$${v}`}
                  />
                  <ReferenceLine y={0} stroke="#1e293b" strokeWidth={1.5} />
                  <Tooltip content={<EmotionTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)', radius: 4 }} />
                  <Bar dataKey="value" radius={[5, 5, 2, 2]} isAnimationActive animationDuration={600}>
                    {emotionChartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.value >= 0 ? '#34d399' : '#f87171'}
                        fillOpacity={entry.value >= 0 ? 0.8 : 0.75}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex items-center justify-center gap-5 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400/80" />
                  <span className="text-[11px] text-slate-500">Ашигтай</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-rose-400/75" />
                  <span className="text-[11px] text-slate-500">Алдагдалтай</span>
                </div>
              </div>
            </div>
          )}

          {/* ── AI зөвлөмж — нэг frame ───────────────────────────────────────── */}
          {hasRecs && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-3.5 h-3.5 text-accent" />
                </div>
                <h2 className="text-sm font-semibold text-white">AI зөвлөмж</h2>
                <span className="ml-auto text-xs text-slate-600">
                  {recs.critical.length + recs.improve.length + recs.reinforce.length} зөвлөмж
                </span>
              </div>

              <div className="divide-y divide-slate-800/70">

                {/* Анхаарах зүйлс */}
                {recs.critical.length > 0 && (
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                      <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Анхаарах зүйлс</p>
                      <span className="text-[10px] text-rose-400/60 bg-rose-500/10 px-1.5 py-0.5 rounded-md ml-1">{recs.critical.length}</span>
                    </div>
                    <div className="space-y-2.5">
                      {recs.critical.map((rec, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/15">
                          <div className="w-1 rounded-full bg-rose-500/40 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-rose-300 leading-snug mb-1">{rec.title}</p>
                            <p className="text-xs text-slate-400 leading-relaxed mb-1.5">{rec.desc}</p>
                            <p className="text-xs text-slate-500"><span className="text-rose-400 font-medium">→</span> {rec.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Сайжруулах зүйлс */}
                {recs.improve.length > 0 && (
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Сайжруулах зүйлс</p>
                      <span className="text-[10px] text-amber-400/60 bg-amber-500/10 px-1.5 py-0.5 rounded-md ml-1">{recs.improve.length}</span>
                    </div>
                    <div className="space-y-2.5">
                      {recs.improve.map((rec, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                          <div className="w-1 rounded-full bg-amber-500/40 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-amber-300 leading-snug mb-1">{rec.title}</p>
                            <p className="text-xs text-slate-400 leading-relaxed mb-1.5">{rec.desc}</p>
                            <p className="text-xs text-slate-500"><span className="text-amber-400 font-medium">→</span> {rec.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Хүчтэй тал */}
                {recs.reinforce.length > 0 && (
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Хүчтэй тал</p>
                      <span className="text-[10px] text-emerald-400/60 bg-emerald-500/10 px-1.5 py-0.5 rounded-md ml-1">{recs.reinforce.length}</span>
                    </div>
                    <div className="space-y-2.5">
                      {recs.reinforce.map((rec, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                          <div className="w-1 rounded-full bg-emerald-500/40 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-emerald-300 leading-snug mb-1">{rec.title}</p>
                            <p className="text-xs text-slate-400 leading-relaxed mb-1.5">{rec.desc}</p>
                            <p className="text-xs text-slate-500"><span className="text-emerald-400 font-medium">→</span> {rec.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
