import { BrainCircuit, TrendingDown, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { analyticsService } from "@/services/analyticsService";
import { EMOTIONS, MISTAKE_TAGS } from "@/lib/constants";

export function MistakesPage() {
  const [mistakesData, setMistakesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMistakes = async () => {
      try {
        setLoading(true);
        const response = await analyticsService.getMistakes('all');
        if (response.success) {
          setMistakesData(response.data);
        } else {
          setError(response.error || "Failed to fetch mistakes data");
        }
      } catch (err) {
        setError("Сервертэй холбогдоход алдаа гарлаа.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMistakes();
  }, []);

  const getMistakeLabel = (id) => {
    const tag = MISTAKE_TAGS.find(t => t.id === id);
    return tag ? tag.label : id;
  };

  const getEmotionLabel = (id) => {
    const emotion = EMOTIONS.find(e => e.id === id);
    return emotion ? `${emotion.emoji} ${emotion.label}` : id;
  };

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
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      ) : mistakesData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Mistakes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              Хамгийн их гаргасан алдаанууд
            </h2>
            <div className="space-y-6">
              {mistakesData.mistakes && mistakesData.mistakes.length > 0 ? (
                mistakesData.mistakes.map((mistake, idx) => {
                  // Calculate percentage relative to the most frequent mistake
                  const maxCount = Math.max(...mistakesData.mistakes.map(m => m.count));
                  const percentage = Math.round((mistake.count / maxCount) * 100);
                  
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300">{getMistakeLabel(mistake.name)}</span>
                        <span className="text-slate-400">{mistake.count} удаа</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-400 rounded-full" 
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">Одоогоор бүртгэгдсэн алдаа алга байна.</p>
              )}
            </div>
          </div>

          {/* Emotions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-400" />
              Сэтгэл зүйн төлөв
            </h2>
            <div className="space-y-6">
              {mistakesData.emotions && mistakesData.emotions.length > 0 ? (
                mistakesData.emotions.map((emotion, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300">{getEmotionLabel(emotion.name)}</span>
                      <span className="text-slate-400">{emotion.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-400 rounded-full" 
                        style={{ width: `${emotion.percentage}%` }} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Одоогоор бүртгэгдсэн сэтгэл зүйн төлөв алга байна.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
