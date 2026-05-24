import { useLang } from "@/contexts/LanguageContext";
import {
  BrainCircuit, TrendingDown, AlertCircle, CheckCircle2,
  Loader2, Activity, Lightbulb, TrendingUp, ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { analyticsService } from "@/services/analyticsService";
import { useTradesUpdated } from "@/lib/tradesSync";
import { TimeFilter } from "@/components/features/analytics/TimeFilter";
import { MARKET_TYPES } from "@/lib/constants";

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

// ── Tag card ──────────────────────────────────────────────────────────────────
function TagCard({ item, rank, max, gradient, badgeColor, delta }) {
  const pct = Math.round((item.count / max) * 100);
  return (
    <div className="group flex items-center gap-4 py-3 px-3 -mx-3 rounded-xl hover:bg-slate-800/40 transition-colors duration-150">
      <span className="w-5 text-center text-xs font-semibold text-slate-600 shrink-0">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-200 font-medium truncate pr-3">{item.name}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {delta !== undefined && (
              <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                delta > 0 ? 'text-rose-400' : delta < 0 ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {delta > 0 ? <ArrowUp className="w-2.5 h-2.5" /> : delta < 0 ? <ArrowDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                {delta !== 0 && Math.abs(delta)}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${badgeColor}`}>
              {item.count}x
            </span>
          </div>
        </div>
        <AnimatedBar pct={pct} gradient={gradient} />
      </div>
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
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-semibold text-white leading-snug">{e.name}</p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${positive ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
          {e.percentage}%
        </span>
      </div>
      <p className={`text-xl font-bold tracking-tight mb-1 ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {positive ? '+' : ''}{e.totalPnl?.toFixed(2)}
      </p>
      <p className="text-xs text-slate-500">{e.count} арилжаа</p>
      <div className="mt-3">
        <AnimatedBar pct={e.percentage} gradient={positive ? "from-emerald-600 to-emerald-400" : "from-rose-600 to-rose-400"} />
      </div>
    </div>
  );
}

// ── Зөвлөмж генератор ─────────────────────────────────────────────────────────
function generateRecommendations(data) {
  if (!data) return [];
  const recs = [];

  // Гол алдаа
  if (data.mistakes[0]) {
    const top = data.mistakes[0];
    const count = top.count;
    recs.push({
      type: 'danger',
      icon: '🚨',
      title: `Гол алдаа: ${top.name}`,
      desc: `Та "${top.name}" алдааг ${count} удаа давтсан байна. Арилжааны өмнө энэ алдааг эс хийх талаар тусгайлан анхаарал хандуулаарай.`,
    });
  }

  // Хамгийн алдагдалтай сэтгэл зүй
  const worstEmo = [...(data.emotions || [])]
    .filter(e => e.totalPnl < 0)
    .sort((a, b) => a.totalPnl - b.totalPnl)[0];
  if (worstEmo) {
    recs.push({
      type: 'warning',
      icon: '⚠️',
      title: `${worstEmo.name} — алдагдалтай нөхцөл`,
      desc: `Та "${worstEmo.name}" сэтгэл зүйтэй байхдаа нийт ${Math.abs(worstEmo.totalPnl).toFixed(0)}$ алдагдал хүлээж байна. Энэ төлөвт арилжаанаас татгалзаж амраарай.`,
    });
  }

  // Хамгийн ашигтай сэтгэл зүй
  const bestEmo = [...(data.emotions || [])]
    .filter(e => e.totalPnl > 0)
    .sort((a, b) => b.totalPnl - a.totalPnl)[0];
  if (bestEmo) {
    recs.push({
      type: 'success',
      icon: '✅',
      title: `${bestEmo.name} — хамгийн ашигтай нөхцөл`,
      desc: `Та "${bestEmo.name}" сэтгэл зүйтэй байхдаа +${bestEmo.totalPnl.toFixed(0)}$ ашиг олж байна. Зөвхөн ийм нөхцөлд арилжаанд орохыг хичээ.`,
    });
  }

  // Гол давуу тал
  if (data.positiveTags[0]) {
    const top = data.positiveTags[0];
    recs.push({
      type: 'info',
      icon: '💪',
      title: `Давуу тал: ${top.name}`,
      desc: `"${top.name}" ${top.count} удаа бүртгэгдсэн — энэ тань гол давуу тал. Бүх арилжаандаа хэрэгжүүлэхийг үргэлжлүүлэ.`,
    });
  }

  // Алдаа > давуу тал анхааруулга
  const mTotal = data.mistakes.reduce((s, m) => s + m.count, 0);
  const pTotal = data.positiveTags.reduce((s, t) => s + t.count, 0);
  if (mTotal > pTotal * 1.5 && mTotal > 0) {
    recs.push({
      type: 'warning',
      icon: '📊',
      title: 'Алдаа давуу талаас илүү байна',
      desc: `Алдааны нийт тоо (${mTotal}) нь давуу талаас (${pTotal}) хамаагүй их байна. Эерэг зан чанаруудаа илүү тэмдэглэж, ялалтаа ч дүн шинжилгээ хий.`,
    });
  }

  return recs;
}

const REC_STYLES = {
  danger:  { border: 'border-rose-500/30',    bg: 'bg-rose-500/5',    title: 'text-rose-300' },
  warning: { border: 'border-amber-500/30',   bg: 'bg-amber-500/5',   title: 'text-amber-300' },
  success: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', title: 'text-emerald-300' },
  info:    { border: 'border-blue-500/30',    bg: 'bg-blue-500/5',    title: 'text-blue-300' },
};

// ── Түүхэн харьцуулалтын row ──────────────────────────────────────────────────
function TrendRow({ name, curr, prev, max }) {
  const delta = curr - prev;
  const pct = Math.round((curr / max) * 100);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
      <span className="text-xs text-slate-300 flex-1 truncate">{name}</span>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-rose-400/60 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-mono text-slate-400 w-6 text-right">{curr}</span>
        <span className={`text-[10px] font-semibold flex items-center gap-0.5 w-10 justify-end ${
          delta > 0 ? 'text-rose-400' : delta < 0 ? 'text-emerald-400' : 'text-slate-600'
        }`}>
          {delta > 0 ? <ArrowUp className="w-2.5 h-2.5" /> : delta < 0 ? <ArrowDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
          {delta !== 0 ? Math.abs(delta) : '—'}
        </span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function MistakesPage() {
  const { t } = useLang();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [timeRange, setTimeRange] = useState('all');
  const [customRange, setCustomRange] = useState(null);
  const [selectedMarket, setSelectedMarket] = useState('all');

  // Түүхэн харьцуулалт: 7 хоног vs 1 сар
  const [histPrev, setHistPrev] = useState(null);

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

  // Өмнөх хугацааны дата — харьцуулалтад ашиглана
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

  const recommendations = generateRecommendations(data);

  // Зах зээлийн шүүлтүүр (frontend-д хийнэ — backend дэмжихгүй тул)
  // Одоогоор бүх дата харуулна, хэрэглэгч сонголт хийх боломжтой

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
                <div>
                  {data.mistakes.map((m, i) => {
                    const prev = histPrev?.mistakes?.find(x => x.name === m.name);
                    return (
                      <TagCard
                        key={i} item={m} rank={i + 1}
                        max={data.mistakes[0].count}
                        gradient="from-rose-600 to-rose-400"
                        badgeColor="bg-rose-500/10 text-rose-400"
                        delta={prev !== undefined ? m.count - prev.count : undefined}
                      />
                    );
                  })}
                </div>
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
                <div>
                  {data.positiveTags.map((tag, i) => {
                    const prev = histPrev?.positiveTags?.find(x => x.name === tag.name);
                    return (
                      <TagCard
                        key={i} item={tag} rank={i + 1}
                        max={data.positiveTags[0].count}
                        gradient="from-emerald-600 to-emerald-400"
                        badgeColor="bg-emerald-500/10 text-emerald-400"
                        delta={prev !== undefined ? tag.count - prev.count : undefined}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Сэтгэл зүй ──────────────────────────────────────────────────── */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <h2 className="text-sm font-semibold text-white">Сэтгэл зүйн нөлөөлөл</h2>
              <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md">
                {data.emotions.length} сэтгэл
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

          {/* ── Түүхэн үзүүлэлтүүд ──────────────────────────────────────────── */}
          {histPrev && (data.mistakes.length > 0 || data.positiveTags.length > 0) && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Түүхэн үзүүлэлтүүд</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Өмнөх хугацаатай харьцуулалт — ↑ нэмэгдсэн · ↓ буурсан</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Алдааны чиг хандлага */}
                <div>
                  <p className="text-xs font-semibold text-rose-400 uppercase tracking-widest mb-3">Алдааны өөрчлөлт</p>
                  {data.mistakes.length === 0 ? (
                    <p className="text-slate-600 text-xs">Алдааны дата байхгүй</p>
                  ) : (
                    data.mistakes.slice(0, 5).map((m, i) => {
                      const prev = histPrev.mistakes?.find(x => x.name === m.name);
                      return (
                        <TrendRow
                          key={i}
                          name={m.name}
                          curr={m.count}
                          prev={prev?.count ?? 0}
                          max={data.mistakes[0].count}
                        />
                      );
                    })
                  )}
                </div>

                {/* Давуу талын чиг хандлага */}
                <div>
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">Давуу талын өөрчлөлт</p>
                  {data.positiveTags.length === 0 ? (
                    <p className="text-slate-600 text-xs">Давуу талын дата байхгүй</p>
                  ) : (
                    data.positiveTags.slice(0, 5).map((tag, i) => {
                      const prev = histPrev.positiveTags?.find(x => x.name === tag.name);
                      return (
                        <TrendRow
                          key={i}
                          name={tag.name}
                          curr={tag.count}
                          prev={prev?.count ?? 0}
                          max={data.positiveTags[0].count}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Зөвлөмж ─────────────────────────────────────────────────────── */}
          {recommendations.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Lightbulb className="w-3.5 h-3.5 text-accent" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Зөвлөмж</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Таны дата дээр суурилсан хувийн зөвлөмж</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendations.map((rec, i) => {
                  const s = REC_STYLES[rec.type] || REC_STYLES.info;
                  return (
                    <div key={i} className={`rounded-xl border p-4 ${s.border} ${s.bg}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{rec.icon}</span>
                        <p className={`text-sm font-semibold ${s.title}`}>{rec.title}</p>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{rec.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
