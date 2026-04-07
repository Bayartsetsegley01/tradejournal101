import { Brain, TrendingUp, AlertTriangle, Lightbulb, ArrowRight, Loader2, MessageSquare, Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { analyticsService } from "@/services/analyticsService";
import { tradeService } from "@/services/tradeService";

export function AIAdvisorPage() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', content: 'Сайн байна уу? Би таны арилжааны AI зөвлөх байна. Танд юу туслах вэ?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const tradesRes = await tradeService.getTrades();
        const trades = tradesRes.data || [];
        
        const response = await analyticsService.getAiInsights(trades);
        if (response.success) {
          setInsights(response.data);
        } else {
          setError(response.error || "Failed to fetch insights");
        }
      } catch (err) {
        setError("Сервертэй холбогдоход алдаа гарлаа.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);

    // Simulate AI response for now
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        content: `Таны "${userMsg}" гэсэн асуултанд хариулъя. Таны сүүлийн үеийн арилжаанаас харахад та тренд дагасан үедээ илүү амжилттай байна.` 
      }]);
      setIsChatLoading(false);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <Brain className="w-6 h-6 text-accent" />
          AI Зөвлөх
        </h1>
        <p className="text-sm text-slate-400 mt-1">Таны арилжааны түүхэнд суурилсан хувийн зөвлөмжүүд болон чат</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="ml-3 text-slate-400">AI анализ хийж байна...</span>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      ) : insights ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Insights */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                Ерөнхий дүгнэлт & Зөвлөмж
              </h2>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 mb-4">
                <p className="text-sm text-amber-200 leading-relaxed">
                  {insights.summary}
                </p>
              </div>
              {insights.advice && (
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-5">
                  <p className="text-sm text-accent leading-relaxed">
                    <strong>Зөвлөгөө:</strong> {insights.advice}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Анхаарах зүйлс & Алдаанууд
                </h3>
                <ul className="space-y-3">
                  {insights.mistakes && insights.mistakes.length > 0 ? (
                    insights.mistakes.map((mistake, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                        <span className="text-sm text-slate-300">{mistake}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">Одоогоор онцгой алдаа илрээгүй байна.</li>
                  )}
                </ul>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Давуу тал
                </h3>
                <ul className="space-y-3">
                  {insights.strengths && insights.strengths.length > 0 ? (
                    insights.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span className="text-sm text-slate-300">{strength}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">Одоогоор онцгой давуу тал илрээгүй байна.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Chatbot */}
          <div className="lg:col-span-1 flex flex-col h-[600px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Туслах</h3>
                <p className="text-xs text-emerald-400">Онлайн</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-accent text-slate-950 rounded-tr-sm' 
                      : 'bg-slate-800 text-slate-200 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/50">
              <div className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Асуултаа бичнэ үү..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-accent hover:bg-accent-hover text-slate-950 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
