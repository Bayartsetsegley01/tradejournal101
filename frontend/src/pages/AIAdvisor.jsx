import { Brain, TrendingUp, AlertTriangle, Lightbulb, Loader2, Send, Bot, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { analyticsService } from "@/services/analyticsService";
import { tradeService } from "@/services/tradeService";

const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';
const getHeaders = () => {
  const token = localStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

function MessageContent({ content }) {
  return (
    <div className="space-y-1">
      {content.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const isList = line.startsWith('- ') || line.startsWith('• ');
        const text = isList ? line.replace(/^[-•]\s/, '') : line;
        const parts = text.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="font-semibold text-white">{part}</strong> : <span key={j}>{part}</span>
        );
        return isList
          ? <div key={i} className="flex gap-2 items-start"><span className="mt-1 text-accent shrink-0">•</span><p className="leading-relaxed">{rendered}</p></div>
          : <p key={i} className="leading-relaxed">{rendered}</p>;
      })}
    </div>
  );
}

export function AIAdvisorPage() {
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
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    const newMessages = [...chatMessages, { role: 'user', content: userMsg }];
    setChatMessages(newMessages);
    setIsChatLoading(true);
    try {
      const apiMessages = newMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ message: userMsg, history: apiMessages })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Уучлаарай, хариулт авахад алдаа гарлаа.' }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Сервертэй холбогдоход алдаа гарлаа.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const quickQuestions = ["Миний хамгийн сайн стратеги юу вэ?", "Ямар өдрүүдэд хамгийн их алддаг вэ?", "Сэтгэл зүйн анализ хийж өг", "Энэ сарын арилжааг дүгнэ"];

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <Brain className="w-6 h-6 text-accent" /> AI Зөвлөх
        </h1>
        <p className="text-sm text-slate-400 mt-1">Таны арилжааны түүхэнд суурилсан хувийн зөвлөмжүүд болон чат</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="ml-3 text-slate-400">AI анализ хийж байна...</span>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">{error}</div>
      ) : insights ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Ерөнхий дүгнэлт</h2>
              <p className="text-sm text-slate-300 leading-relaxed">{insights.summary}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> Алдаанууд</h3>
                <ul className="space-y-2">{insights.mistakes?.map((m, i) => (<li key={i} className="flex items-start gap-2"><span className="text-rose-400 text-xs font-bold mt-0.5">{i+1}</span><span className="text-xs text-slate-300">{m}</span></li>))}</ul>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> Давуу талууд</h3>
                <ul className="space-y-2">{insights.strengths?.map((s, i) => (<li key={i} className="flex items-start gap-2"><span className="text-emerald-400 text-xs font-bold mt-0.5">{i+1}</span><span className="text-xs text-slate-300">{s}</span></li>))}</ul>
              </div>
            </div>
            {insights.advice && (
              <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">Дараагийн алхам</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{insights.advice}</p>
              </div>
            )}
          </div>
          <div className="lg:col-span-3 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden" style={{ height: '680px' }}>
            <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center"><Bot className="w-5 h-5 text-accent" /></div>
              <div><h3 className="text-sm font-bold text-white">AI Зөвлөх</h3><p className="text-xs text-emerald-400">Claude AI</p></div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-accent/20' : 'bg-slate-800'}`}>
                    {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-accent" /> : <Bot className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-accent text-slate-950 rounded-tr-md' : 'bg-slate-800 text-slate-100 rounded-tl-md'}`}>
                    {msg.role === 'assistant' ? <MessageContent content={msg.content} /> : <span>{msg.content}</span>}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center shrink-0"><Bot className="w-3.5 h-3.5 text-slate-400" /></div>
                  <div className="bg-slate-800 rounded-2xl rounded-tl-md px-4 py-3 flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            {chatMessages.length <= 1 && (
              <div className="px-5 pb-2 flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button key={i} onClick={() => setChatInput(q)} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 transition-colors">{q}</button>
                ))}
              </div>
            )}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800">
              <div className="flex gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Асуултаа бичнэ үү..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all placeholder:text-slate-500" />
                <button type="submit" disabled={!chatInput.trim() || isChatLoading} className="w-11 h-11 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"><Send className="w-4 h-4" /></button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
