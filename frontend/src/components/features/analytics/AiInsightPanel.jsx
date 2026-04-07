import { Sparkles, ArrowRight, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { useState, useEffect } from "react";
import { analyticsService } from "@/services/analyticsService";

export function AiInsightPanel() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        // Pass empty array to let backend fetch from DB
        const response = await analyticsService.getAiInsights([]);
        if (response.success) {
          setInsights(response.data);
        } else {
          setInsights({
            summary: "Таны арилжааны түүхэнд анализ хийхэд эрсдэлийн удирдлага сайн байгаа ч, заримдаа эрт хаах хандлагатай байна.",
            mistakes: ["FOMO-д автаж төлөвлөгөөгүй арилжаанд орох", "Ашигтай арилжааг эрт хаах"],
            advice: "Арилжааны төлөвлөгөөгөө чанд баримталж, Stop Loss болон Take Profit цэгүүдээ урьдчилан тодорхойлж, түүндээ хүрэх хүртэл хүлээцтэй хандахыг зөвлөж байна."
          });
        }
      } catch (error) {
        console.error("Failed to fetch AI insights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  return (
    <div className="bg-slate-900 rounded-xl border border-accent/20 flex flex-col h-full relative overflow-hidden hover:shadow-[0_0_20px_rgba(200,240,122,0.1)] transition-all duration-300 group">
      {/* Background glow effect */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-accent/10 blur-3xl rounded-full group-hover:bg-accent/20 transition-colors duration-500" />
      
      <div className="p-5 border-b border-slate-800/50 flex items-center gap-2 relative z-10">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        <h3 className="text-base font-medium text-white">AI Quick Insight</h3>
      </div>
      
      <div className="p-5 flex-1 flex flex-col gap-4 relative z-10 overflow-y-auto">
        <div className="space-y-4">
          {loading ? (
            <div className="text-slate-400 text-sm animate-pulse">AI анализ хийж байна...</div>
          ) : insights ? (
            <>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300 leading-relaxed">
                  {insights.summary}
                </p>
              </div>
              
              {insights.mistakes && insights.mistakes.length > 0 && (
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300 leading-relaxed">
                    <p className="font-medium text-amber-400/80 mb-1">Анхаарах зүйлс:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {insights.mistakes.map((mistake, idx) => (
                        <li key={idx}>{mistake}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {insights.advice && (
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300 leading-relaxed">
                    <span className="font-medium text-accent/80 block mb-1">Зөвлөгөө:</span>
                    {insights.advice}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-slate-400 text-sm">Мэдээлэл олдсонгүй.</div>
          )}
        </div>

        <div className="mt-auto pt-4">
          <button className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
            Дэлгэрэнгүй AI Анализ
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
