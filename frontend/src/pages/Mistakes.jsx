import { useLang } from "@/contexts/LanguageContext";
import { BrainCircuit, TrendingDown, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { analyticsService } from "@/services/analyticsService";

export function MistakesPage() {
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    analyticsService.getMistakes('all')
      .then(res => {
        if (res.success) setData(res.data);
        else setError(res.error || "Алдаа гарлаа");
      })
      .catch(() => setError("Сервертэй холбогдоход алдаа гарлаа."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <BrainCircuit className="w-6 h-6 text-accent" />
          Алдаа & Сэтгэл зүй
        </h1>
        <p className="text-sm text-slate-400 mt-1">Арилжааны алдаа болон сэтгэл зүйн төлөв байдлын анализ</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="ml-3 text-slate-400">Өгөгдөл уншиж байна...</span>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">{error}</div>
      ) : !data || data.totalTrades === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Одоогоор бүртгэгдсэн дата байхгүй байна.</p>
          <p className="text-sm mt-2">Арилжаа нэмэхдээ Psychology & Tags tab-аас сэтгэл зүй болон алдааны tag сонгоорой.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Mistake Tags */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              {t('topMistakesTitle')}
            </h2>
            {data.mistakes.length === 0 ? (
              <p className="text-slate-500 text-sm">Алдааны tag бүртгэгдээгүй байна.</p>
            ) : (
              <div className="space-y-4">
                {data.mistakes.map((m, i) => {
                  const max = data.mistakes[0].count;
                  const pct = Math.round((m.count / max) * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-300">{m.name}</span>
                        <span className="text-rose-400 font-medium">{m.count}x</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Positive Tags */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              {t('positiveTagsTitle')}
            </h2>
            {data.positiveTags.length === 0 ? (
              <p className="text-slate-500 text-sm">Positive tag бүртгэгдээгүй байна.</p>
            ) : (
              <div className="space-y-4">
                {data.positiveTags.map((t, i) => {
                  const max = data.positiveTags[0].count;
                  const pct = Math.round((t.count / max) * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-300">{t.name}</span>
                        <span className="text-emerald-400 font-medium">{t.count}x</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Emotion Stats */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-400" />
              Сэтгэл зүйн нөлөөлөл
            </h2>
            {data.emotions.length === 0 ? (
              <p className="text-slate-500 text-sm">Сэтгэл зүйн tag бүртгэгдээгүй байна.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {data.emotions.map((e, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-xl p-4">
                    <p className="text-sm font-medium text-white mb-1">{e.name}</p>
                    <p className="text-xs text-slate-400">{e.count} арилжаа · {e.percentage}%</p>
                    <p className={`text-base font-bold mt-2 ${e.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {e.totalPnl >= 0 ? '+' : ''}{e.totalPnl?.toFixed(2)}
                    </p>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${e.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
