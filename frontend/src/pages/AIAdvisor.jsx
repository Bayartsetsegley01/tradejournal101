import {
  Brain, TrendingUp, AlertTriangle, Lightbulb, Loader2, Send,
  Bot, User, Plus, Trash2, MessageSquare,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { aiService } from "@/services/aiService";
import { tradeService } from "@/services/tradeService";
import { useLang } from "@/contexts/LanguageContext";
import { useTradesUpdated } from "@/lib/tradesSync";

// ── Helpers ───────────────────────────────────────────────────────────────────
function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return 'Яг сая';
  if (m < 60) return `${m}м өмнө`;
  if (h < 24) return `${h}ц өмнө`;
  if (d === 1) return 'Өчигдөр';
  if (d < 7)  return `${d} өдрийн өмнө`;
  return new Date(dateStr).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' });
}

// ── MessageContent ─────────────────────────────────────────────────────────────
function MessageContent({ content, isUser }) {
  const boldCls = isUser ? "font-semibold text-slate-950" : "font-semibold text-gray-900";
  return (
    <div className="space-y-1">
      {content.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const isList = line.startsWith('- ') || line.startsWith('• ');
        const text   = isList ? line.replace(/^[-•]\s/, '') : line;
        const parts  = text.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((p, j) =>
          j % 2 === 1 ? <strong key={j} className={boldCls}>{p}</strong> : <span key={j}>{p}</span>
        );
        return isList
          ? <div key={i} className="flex gap-2 items-start"><span className="mt-1 shrink-0 text-blue-600">•</span><p className="leading-relaxed">{rendered}</p></div>
          : <p key={i} className="leading-relaxed">{rendered}</p>;
      })}
    </div>
  );
}

// ── AIAdvisorPage ─────────────────────────────────────────────────────────────
export function AIAdvisorPage() {
  const { t } = useLang();

  // Insights
  const [insights, setInsights]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [insightError, setInsightError] = useState(null);

  // Sessions
  const [sessions, setSessions]           = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Chat
  const [chatMessages, setChatMessages]   = useState([]);
  const [chatInput, setChatInput]         = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMode, setChatMode]           = useState('analysis');
  const chatEndRef = useRef(null);

  const MODES = [
    { id: 'analysis', label: 'Analysis', color: 'text-accent'      },
    { id: 'advice',   label: 'Advice',   color: 'text-emerald-400' },
    { id: 'learning', label: 'Learning', color: 'text-blue-400'    },
  ];

  const modeQuickQ = {
    analysis: [t('quickQ2'), 'Ямар өдөр хамгийн сайн гүйцэтгэлтэй байдаг вэ?'],
    advice:   [t('quickQ3'), t('quickQ4'), 'Эрсдэлийн удирдлагаа хэрхэн сайжруулах вэ?'],
    learning: ['Риск/Ашгийн харьцаа гэж юу вэ?', 'Арилжааны тэмдэглэл яагаад хэрэгтэй вэ?', 'Win rate гэж юу вэ?'],
  };

  // ── Fetch insights ────────────────────────────────────────────────────────────
  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      const tradesRes = await tradeService.getTrades();
      const trades    = tradesRes.data || [];
      const res       = await aiService.getInsights(trades);
      if (res.success) setInsights(res.data);
      else setInsightError(res.error || 'Failed to fetch insights');
    } catch { setInsightError(t('errorConnecting')); }
    finally   { setLoading(false); }
  }, [t]);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);
  useTradesUpdated(fetchInsights);

  // ── Load sessions ─────────────────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    const res = await aiService.sessions.list();
    if (res.success) setSessions(res.data || []);
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // ── Scroll chat to bottom ─────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Start new chat ────────────────────────────────────────────────────────────
  const startNewChat = async () => {
    const res = await aiService.sessions.create('Шинэ чат');
    if (res.success) {
      setActiveSessionId(res.data.id);
      setChatMessages([{ role: 'assistant', content: t('aiWelcome') }]);
      await loadSessions();
    } else {
      // Offline fallback
      setActiveSessionId(null);
      setChatMessages([{ role: 'assistant', content: t('aiWelcome') }]);
    }
  };

  // ── Open existing session ─────────────────────────────────────────────────────
  const openSession = async (sessionId) => {
    setActiveSessionId(sessionId);
    const res = await aiService.sessions.getMessages(sessionId);
    if (res.success) setChatMessages(res.data);
  };

  // ── Delete session ────────────────────────────────────────────────────────────
  const handleDeleteSession = async (id) => {
    await aiService.sessions.delete(id);
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setChatMessages([]);
    }
    setDeleteConfirm(null);
    await loadSessions();
  };

  // ── Send message ──────────────────────────────────────────────────────────────
  const handleSend = async (msgText) => {
    const userMsg = (msgText ?? chatInput).trim();
    if (!userMsg || isChatLoading) return;
    setChatInput('');

    // Ensure active session
    let sessionId = activeSessionId;
    const isFirstMsg = chatMessages.filter(m => m.role === 'user').length === 0;

    if (!sessionId) {
      const res = await aiService.sessions.create(userMsg.slice(0, 40));
      if (res.success) {
        sessionId = res.data.id;
        setActiveSessionId(sessionId);
        loadSessions();
      }
    }

    // Optimistic UI
    const newMessages = [...chatMessages, { role: 'user', content: userMsg }];
    setChatMessages(newMessages);
    setIsChatLoading(true);

    // Save user message (background)
    if (sessionId) {
      aiService.sessions.saveMessage(sessionId, 'user', userMsg);
      if (isFirstMsg) {
        aiService.sessions.updateTitle(sessionId, userMsg.slice(0, 40))
          .then(() => loadSessions());
      }
    }

    try {
      const history = newMessages.map(m => ({ role: m.role, content: m.content }));
      const data    = await aiService.sendChat(userMsg, history, chatMode);

      if (data.success && data.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        if (sessionId) aiService.sessions.saveMessage(sessionId, 'assistant', data.reply);
      } else {
        const errMsg = data.code === 'AI_QUOTA'
          ? 'AI функц түр ажиллахгүй байна.'
          : t('aiErrorReply');
        setChatMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: t('aiErrorConnect') }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const showQuickQ = chatMessages.filter(m => m.role === 'user').length === 0;
  const quickQuestions = modeQuickQ[chatMode] || [];

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <Brain className="w-6 h-6 text-accent" /> {t('aiTitle')}
        </h1>
        <p className="text-sm text-slate-400 mt-1">{t('aiDesc')}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="ml-3 text-slate-400">{t('aiLoading')}</span>
        </div>
      ) : insightError ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">{insightError}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left: Insights ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {insights && (
              <>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" /> {t('overallSummary')}
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">{insights.summary}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5">
                    <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> {t('mistakes_ai')}
                    </h3>
                    <ul className="space-y-2">
                      {insights.mistakes?.map((m, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-rose-400 text-xs font-bold mt-0.5">{i+1}</span>
                          <span className="text-xs text-slate-300">{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                    <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" /> {t('strengths')}
                    </h3>
                    <ul className="space-y-2">
                      {insights.strengths?.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400 text-xs font-bold mt-0.5">{i+1}</span>
                          <span className="text-xs text-slate-300">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {insights.advice && (
                  <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5">
                    <h3 className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">{t('nextStep')}</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{insights.advice}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Right: Session sidebar + Chat ── */}
          <div
            className="lg:col-span-3 flex border border-slate-800 rounded-2xl overflow-hidden bg-slate-900"
            style={{ height: '680px' }}
          >

            {/* ── Session sidebar ── */}
            <div className="w-[210px] shrink-0 border-r border-slate-800 flex flex-col bg-slate-950/40">
              {/* New chat button */}
              <div className="p-3 border-b border-slate-800 shrink-0">
                <button
                  onClick={startNewChat}
                  className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-slate-950 text-xs font-bold py-2.5 px-3 rounded-xl transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Шинэ чат
                </button>
              </div>

              {/* Session list */}
              <div className="flex-1 overflow-y-auto py-1">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
                    <MessageSquare className="w-8 h-8 text-slate-700" />
                    <p className="text-[11px] text-slate-600">Чатын түүх алга</p>
                  </div>
                ) : (
                  sessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => openSession(session.id)}
                      className={`relative group px-3 py-2.5 mx-1 my-0.5 rounded-xl cursor-pointer transition-all ${
                        activeSessionId === session.id
                          ? 'bg-slate-700/60 border border-slate-600/40'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      <p className="text-[12px] font-medium text-slate-200 truncate leading-snug pr-6">
                        {session.title || 'Шинэ чат'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {relativeTime(session.updated_at || session.created_at)}
                      </p>

                      {/* Delete button */}
                      {deleteConfirm === session.id ? (
                        <div
                          className="absolute inset-0 rounded-xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center gap-2 px-2"
                          onClick={e => e.stopPropagation()}
                        >
                          <span className="text-[10px] text-rose-300">Устгах уу?</span>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-md font-semibold"
                          >Тийм</button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-[10px] text-slate-400 hover:text-white"
                          >Үгүй</button>
                        </div>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteConfirm(session.id); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg hover:bg-rose-500/20 flex items-center justify-center transition-all"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Chat area ── */}
            <div className="flex-1 flex flex-col min-w-0">

              {/* Chat header — mode tabs */}
              <div className="px-4 py-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{t('aiChatTitle')}</h3>
                    <p className="text-[11px] text-slate-500">{chatMessages.filter(m => m.role === 'user').length} мессеж</p>
                  </div>
                </div>
                <div className="flex gap-1 bg-slate-950/50 rounded-xl p-1">
                  {MODES.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setChatMode(m.id)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        chatMode === m.id
                          ? `bg-slate-800 ${m.color} shadow-sm`
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {activeSessionId === null && chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                      <Bot className="w-7 h-7 text-accent" />
                    </div>
                    <p className="text-sm font-semibold text-white">AI Зөвлөх</p>
                    <p className="text-xs text-slate-500 max-w-[200px]">Шинэ чат эхлүүлэх товч дарна уу</p>
                    <button
                      onClick={startNewChat}
                      className="mt-1 flex items-center gap-2 bg-accent text-slate-950 text-xs font-bold py-2 px-4 rounded-xl"
                    >
                      <Plus className="w-3.5 h-3.5" /> Шинэ чат
                    </button>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div key={idx} className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-accent/20' : 'bg-slate-700'}`}>
                          {isUser
                            ? <User className="w-3.5 h-3.5 text-accent" />
                            : <Bot  className="w-3.5 h-3.5 text-slate-300" />
                          }
                        </div>
                        <div
                          className={`max-w-[80%] text-sm leading-relaxed ${isUser ? 'rounded-[12px] rounded-br-[4px] text-slate-950' : 'rounded-[12px] rounded-bl-[4px] text-[#111827]'}`}
                          style={{ background: isUser ? '#c8f07a' : '#F3F4F6', padding: '12px 16px' }}
                        >
                          {isUser
                            ? <span>{msg.content}</span>
                            : <MessageContent content={msg.content} isUser={false} />
                          }
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing indicator */}
                {isChatLoading && (
                  <div className="flex items-end gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                    <div className="rounded-[12px] rounded-bl-[4px] flex gap-1.5 items-center" style={{ background: '#F3F4F6', padding: '12px 16px' }}>
                      {[0, 150, 300].map(d => (
                        <div key={d} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick questions */}
              {showQuickQ && activeSessionId && quickQuestions.length > 0 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="text-xs bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white px-3 py-1.5 rounded-full border border-slate-700 hover:border-slate-500 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={e => { e.preventDefault(); handleSend(); }}
                className="p-3 border-t border-slate-800 shrink-0"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder={activeSessionId ? t('aiInputPlaceholder') : 'Эхлээд шинэ чат үүсгэнэ үү…'}
                    disabled={!activeSessionId && chatMessages.length === 0}
                    className="flex-1 bg-slate-950 border-2 border-slate-700 hover:border-slate-600 focus:border-accent/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors placeholder:text-slate-500 disabled:opacity-40"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isChatLoading}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95 ${
                      chatInput.trim() && !isChatLoading ? 'bg-accent' : 'bg-slate-700 opacity-40'
                    }`}
                  >
                    <Send className={`w-4 h-4 ${chatInput.trim() && !isChatLoading ? 'text-slate-950' : 'text-slate-400'}`} />
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
