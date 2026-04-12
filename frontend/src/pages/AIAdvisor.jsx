import { Brain, TrendingUp, AlertTriangle, Lightbulb, Loader2, MessageSquare, Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { analyticsService } from "@/services/analyticsService";
import { tradeService } from "@/services/tradeService";
import { useLang } from "@/contexts/LanguageContext";

const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';
const getHeaders = () => {
  const token = localStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

export function AIAdvisorPage() {
  const { t } = useLang();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Сайн байна уу? Би таны арилжааны AI зөвлөх байна. Арилжааны дүн шинжилгээ, сэтгэл зүй, стратегийн талаар асуулт тавьж болно.' }
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
        if (response.success) setInsights(response.data);
        else setError(response.error || "Failed to fetch insights");
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
    e?.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    const updated = [...chatMessages, { role: 'user', content: userMsg }];
    setChatMessages(updated);
    setIsChatLoading(true);
    try {
      const apiMessages = updated
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST', headers: getHeaders(), credentials: 'include',
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: data.success ? data.data : 'Уучлаарай, алдаа гарлаа.'
      }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Сервертэй холбогдоход алдаа гарлаа.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <Brain className="w-6 h-6 text-accent" />
          {t('aiTitle')}
        </h1>
        <p className="text-sm text-slate-400 mt-1">{t('aiDesc')}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="ml-3 text-slate-400">{t('aiAnalyzing')}</span>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">{error}</div>
      ) : insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-accent" />
              <h2 className="text-base font-semibold text-white">{t('overallSummary')}</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{insights.summary}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-semibold text-white">{t('mistakes_ai')}</h2>
            </div>
            <ul className="space-y-2">
              {(insights.mistakes || []).map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 text-xs flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">{t('strengths')}</h2>
            </div>
            <ul className="space-y-2">
              {(insights.strengths || []).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {insights.advice && (
            <div className="md:col-span-2 bg-accent/5 border border-accent/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-accent" />
                <h2 className="text-base font-semibold text-white">{t('nextStep')}</h2>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{insights.advice}</p>
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[500px]">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-accent" />
          <h2 className="text-base font-semibold text-white">{t('aiChat')}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent text-slate-950 font-semibold'
                  : 'bg-slate-800 text-slate-100 border border-slate-700'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
                <span className="text-sm text-slate-300">Бодож байна...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex gap-3">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e)}
              placeholder={t('askAI')}
              disabled={isChatLoading}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-accent/50 disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isChatLoading}
              className="bg-accent hover:bg-accent-hover text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
