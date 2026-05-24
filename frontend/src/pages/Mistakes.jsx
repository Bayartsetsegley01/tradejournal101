import { useLang } from "@/contexts/LanguageContext";
import {
  BrainCircuit, TrendingDown, AlertCircle, CheckCircle2,
  Loader2, Activity,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { analyticsService } from "@/services/analyticsService";
import { useTradesUpdated } from "@/lib/tradesSync";

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

function TagCard({ item, rank, max, gradient, badgeColor }) {
  const pct = Math.round((item.count / max) * 100);
  return (
    <div className="group flex items-center gap-4 py-3 px-3 -mx-3 rounded-xl hover:bg-slate-800/40 transition-colors duration-150">
      <span className="w-5 text-center text-xs font-semibold text-slate-600 shrink-0">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-200 font-medium truncate pr-3">{item.name}</span>
          <span className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold ${badgeColor}`}>
            {item.count}x
          </span>
        </div>
        <AnimatedBar pct={pct} gradient={gradient} />
      </div>
    </div>
  );
}

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

export function MistakesPage() {
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMistakes = useCallback(() => {
    setLoading(true);
    analyticsService.getMistakes('all')
      .then(res => {
        if (res.success) setData(res.data);
        else setError(res.error || "Алдаа гарлаа");
      })
      .catch(() => setError("Сервертэй холбогдоход алдаа гарлаа."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMistakes(); }, [fetchMistakes]);
  useTradesUpdated(fetchMistakes);

  return (
    <div className="p-6 lg:p-8 max-w-[1280px] mx-auto w-full flex flex-col gap-6 animate-page-enter">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
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

      {/* ── States ─────────────────────────────────────────────────────────── */}
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

          {/* ── Top row: Mistakes + Strengths ─────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Mistakes */}
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
                  {data.mistakes.map((m, i) => (
                    <TagCard
                      key={i}
                      item={m}
                      rank={i + 1}
                      max={data.mistakes[0].count}
                      gradient="from-rose-600 to-rose-400"
                      badgeColor="bg-rose-500/10 text-rose-400"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Strengths */}
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
                  {data.positiveTags.map((tag, i) => (
                    <TagCard
                      key={i}
                      item={tag}
                      rank={i + 1}
                      max={data.positiveTags[0].count}
                      gradient="from-emerald-600 to-emerald-400"
                      badgeColor="bg-emerald-500/10 text-emerald-400"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Emotion section ────────────────────────────────────────────── */}
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
              <p className="text-slate-600 text-sm py-4 text-center">Сэтгэл зүйн tag бүртгэгдээгүй байна.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {data.emotions.map((e, i) => (
                  <EmotionCard key={i} e={e} />
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
