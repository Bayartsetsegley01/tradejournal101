import { Brain, TrendingUp, AlertTriangle, Lightbulb, Loader2, Send, Bot, User, Trash2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { aiService } from "@/services/aiService";
import { tradeService } from "@/services/tradeService";
import { useLang } from "@/contexts/LanguageContext";
import { useTradesUpdated } from "@/lib/tradesSync";

const STORAGE_KEY = "tj_ai_chat_messages";

function MessageContent({ content, isUser }) {
  const boldClass = isUser ? "font-semibold text-white" : "font-semibold text-gray-900";
  return (
    <div className="space-y-1">
      {content.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const isList = line.startsWith("- ") || line.startsWith("• ");
        const text   = isList ? line.replace(/^[-•]\s/, "") : line;
        const parts  = text.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((part, j) =>
          j % 2 === 1
            ? <strong key={j} className={boldClass}>{part}</strong>
            : <span key={j}>{part}</span>
        );
        return isList
          ? (
            <div key={i} className="flex gap-2 items-start">
              <span className={`mt-1 shrink-0 ${isUser ? "text-blue-200" : "text-blue-600"}`}>•</span>
              <p className="leading-relaxed">{rendered}</p>
            </div>
          )
          : <p key={i} className="leading-relaxed">{rendered}</p>;
      })}
    </div>
  );
}

export function AIAdvisorPage() {
  const { t } = useLang();
  const [insights, setInsights]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [chatMode, setChatMode]       = useState("analysis");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatInput, setChatInput]     = useState("");
  const chatEndRef = useRef(null);

  // ── Load messages from localStorage on mount ──────────────────────────────
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [{ role: "assistant", content: t("aiWelcome") }];
  });

  // ── Persist to localStorage whenever messages change ──────────────────────
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chatMessages)); }
    catch {}
  }, [chatMessages]);

  const MODES = [
    { id: "analysis", label: "Analysis", color: "text-accent"       },
    { id: "advice",   label: "Advice",   color: "text-emerald-400"  },
    { id: "learning", label: "Learning", color: "text-blue-400"     },
  ];

  const modeQuickQ = {
    analysis: [t("quickQ1"), t("quickQ2")],
    advice:   [t("quickQ3"), t("quickQ4"), "Эрсдэлийн удирдлагаа хэрхэн сайжруулах вэ?"],
    learning: ["Риск/Ашгийн харьцаа гэж юу вэ?", "Арилжааны тэмдэглэл яагаад хэрэгтэй вэ?", "Win rate гэж юу вэ?"],
  };

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      const tradesRes = await tradeService.getTrades();
      const trades    = tradesRes.data || [];
      const response  = await aiService.getInsights(trades);
      if (response.success) setInsights(response.data);
      else setError(response.error || "Failed to fetch insights");
    } catch {
      setError(t("errorConnecting"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);
  useTradesUpdated(fetchInsights);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async (msgText) => {
    const userMsg = (msgText ?? chatInput).trim();
    if (!userMsg || isChatLoading) return;
    setChatInput("");
    const newMessages = [...chatMessages, { role: "user", content: userMsg }];
    setChatMessages(newMessages);
    setIsChatLoading(true);
    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const data = await aiService.sendChat(userMsg, apiMessages);
      if (data.success && data.reply) {
        setChatMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { role: "assistant", content: t("aiErrorReply") }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: t("aiErrorConnect") }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleFormSubmit = (e) => { e.preventDefault(); handleSendMessage(); };

  const clearChat = () => {
    const fresh = [{ role: "assistant", content: t("aiWelcome") }];
    setChatMessages(fresh);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)); } catch {}
  };

  const quickQuestions = modeQuickQ[chatMode] || [];
  const showQuickQ = chatMessages.length <= 1;

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <Brain className="w-6 h-6 text-accent" /> {t("aiTitle")}
        </h1>
        <p className="text-sm text-slate-400 mt-1">{t("aiDesc")}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="ml-3 text-slate-400">{t("aiLoading")}</span>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">{error}</div>
      ) : insights ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left: insights ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" /> {t("overallSummary")}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">{insights.summary}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" /> {t("mistakes_ai")}
                </h3>
                <ul className="space-y-2">
                  {insights.mistakes?.map((m, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-400 text-xs font-bold mt-0.5">{i + 1}</span>
                      <span className="text-xs text-slate-300">{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" /> {t("strengths")}
                </h3>
                <ul className="space-y-2">
                  {insights.strengths?.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 text-xs font-bold mt-0.5">{i + 1}</span>
                      <span className="text-xs text-slate-300">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {insights.advice && (
              <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">{t("nextStep")}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{insights.advice}</p>
              </div>
            )}
          </div>

          {/* ── Right: chat ── */}
          <div
            className="lg:col-span-3 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
            style={{ height: "680px" }}
          >
            {/* Chat header */}
            <div className="px-5 py-3 border-b border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{t("aiChatTitle")}</h3>
                    <p className="text-xs text-slate-500">{chatMessages.length - 1} мессеж</p>
                  </div>
                </div>
                {/* Clear chat */}
                <button
                  onClick={clearChat}
                  title="Чат цэвэрлэх"
                  className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Mode tabs */}
              <div className="flex gap-1 bg-slate-950/50 rounded-xl p-1">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setChatMode(m.id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      chatMode === m.id
                        ? `bg-slate-800 ${m.color} shadow-sm`
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {chatMessages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={idx}
                    className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        isUser ? "bg-blue-600" : "bg-slate-700"
                      }`}
                    >
                      {isUser
                        ? <User className="w-3.5 h-3.5 text-white" />
                        : <Bot  className="w-3.5 h-3.5 text-slate-300" />
                      }
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[78%] text-sm leading-relaxed ${
                        isUser
                          ? "rounded-[12px] rounded-br-[4px] text-white"
                          : "rounded-[12px] rounded-bl-[4px] text-[#111827]"
                      }`}
                      style={{
                        background : isUser ? "#2563EB" : "#F3F4F6",
                        padding    : "12px 16px",
                      }}
                    >
                      {isUser
                        ? <span>{msg.content}</span>
                        : <MessageContent content={msg.content} isUser={false} />
                      }
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isChatLoading && (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                  <div
                    className="rounded-[12px] rounded-bl-[4px] flex gap-1.5 items-center"
                    style={{ background: "#F3F4F6", padding: "12px 16px" }}
                  >
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick question chips */}
            {showQuickQ && quickQuestions.length > 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white px-3 py-1.5 rounded-full border border-slate-700 hover:border-slate-500 transition-all duration-150"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleFormSubmit} className="p-4 border-t border-slate-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={t("aiInputPlaceholder")}
                  className="flex-1 bg-slate-950 border-2 border-slate-700 hover:border-slate-600 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 active:scale-95"
                  style={{ background: chatInput.trim() && !isChatLoading ? "#2563EB" : "#1e3a5f", opacity: chatInput.trim() && !isChatLoading ? 1 : 0.5 }}
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
