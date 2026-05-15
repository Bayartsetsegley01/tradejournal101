import { Sparkles, ArrowRight, AlertTriangle, CheckCircle2, Lightbulb, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { aiService } from "@/services/aiService";
import { useLang } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

export function AiInsightPanel() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiDisabled, setAiDisabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await aiService.getInsights([]);
        if (response.httpStatus === 402 || response.code === 'AI_QUOTA') {
          setAiDisabled(true);
          return;
        }
        if (response.success) setInsights(response.data);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden hover:border-accent/20 hover:shadow-[0_0_24px_rgba(200,240,122,0.06)] transition-all duration-300 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-800/60 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white leading-none">
            {lang === 'mn' ? 'AI Зөвлөгөө' : 'AI Insight'}
          </h3>
          <p className="text-[11px] text-slate-600 mt-0.5">
            {lang === 'mn' ? 'Хиймэл оюун ухааны дүн шинжилгээ' : 'AI-powered analysis'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-accent" />
            {lang === 'mn' ? 'AI анализ хийж байна...' : 'AI is analyzing...'}
          </div>
        ) : aiDisabled ? (
          <div className="flex items-start gap-3 p-3 bg-amber-500/8 border border-amber-500/15 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-400/90 leading-relaxed">
              {lang === 'mn' ? 'AI функц түр ажиллахгүй байна' : 'AI features temporarily unavailable'}
            </p>
          </div>
        ) : insights ? (
          <div className="space-y-4">
            {insights.summary && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300 leading-relaxed">{insights.summary}</p>
              </div>
            )}
            {insights.mistakes?.length > 0 && (
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm text-slate-400 leading-relaxed">
                  <p className="font-medium text-amber-400 mb-1.5 text-xs uppercase tracking-wide">
                    {lang === 'mn' ? 'Анхаарах' : 'Watch out'}
                  </p>
                  <ul className="space-y-1">
                    {insights.mistakes.map((m, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1 shrink-0">·</span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {insights.advice && (
              <div className="flex items-start gap-3">
                <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-accent/80 uppercase tracking-wide mb-1.5">
                    {lang === 'mn' ? 'Зөвлөгөө' : 'Advice'}
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed">{insights.advice}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            {lang === 'mn' ? 'Мэдээлэл олдсонгүй' : 'No insights available'}
          </p>
        )}

        <div className="mt-auto pt-3">
          <button
            onClick={() => navigate('/app/ai-advisor')}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 hover:border-slate-600 text-slate-300 hover:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-all"
          >
            {lang === 'mn' ? 'Дэлгэрэнгүй AI анализ' : 'Full AI Analysis'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
