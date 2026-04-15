import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Trash2, ChevronDown } from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

// Format markdown-like text (bold, newlines)
function MessageContent({ content }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        // Bold: **text**
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="leading-relaxed">
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part
            )}
          </p>
        );
      })}
    </div>
  );
}

const QUICK_PROMPTS = [
  "Миний арилжааны алдааг дүгнэ",
  "Win rate сайжруулах арга",
  "Сэтгэл зүйн зөвлөгөө өгч",
  "Хамгийн сайн арилжааг тайлбарла",
];

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Сайн байна уу! 👋 Би таны **AI арилжааны зөвлөх** байна.\n\nАрилжааны дата, сэтгэл зүй, стратегийн талаар асуулт асуугаарай.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tradeContext, setTradeContext] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
      // Load trade context
      fetchTradeContext();
    }
  }, [isOpen, isMinimized]);

  const fetchTradeContext = async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/trades`, { headers: getHeaders(), credentials: 'include' });
      const data = await r.json();
      if (data.success && data.data?.length > 0) {
        const trades = data.data.slice(0, 20);
        const closed = trades.filter(t => t.status === 'CLOSED');
        const wins = closed.filter(t => parseFloat(t.pnl) > 0);
        setTradeContext({
          totalTrades: closed.length,
          winRate: closed.length > 0 ? ((wins.length / closed.length) * 100).toFixed(0) : 0,
          totalPnl: closed.reduce((s, t) => s + parseFloat(t.pnl || 0), 0).toFixed(2),
          recentTrades: trades.slice(0, 5).map(t => ({
            symbol: t.symbol,
            direction: t.direction,
            pnl: t.pnl,
            emotion_before: t.emotion_before,
            emotion_after: t.emotion_after,
            strategy: t.strategy,
            mistake_tags: t.mistake_tags,
            positive_tags: t.positive_tags,
          }))
        });
      }
    } catch (e) {
      console.log('Could not load trade context');
    }
  };

  const handleSend = async (text) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const systemPrompt = `Та бол мэргэжлийн арилжааны зөвлөх AI юм. Монгол хэлээр богино, тодорхой хариулт өг.
Хариултаа 3-5 өгүүлбэрт хэмжлэг. Markdown формат ашиглаж болно (**bold**).
${tradeContext ? `\nХэрэглэгчийн арилжааны мэдээлэл:
- Нийт хаасан арилжаа: ${tradeContext.totalTrades}
- Win Rate: ${tradeContext.winRate}%
- Нийт PnL: ${tradeContext.totalPnl}
- Сүүлийн арилжаанууд: ${JSON.stringify(tradeContext.recentTrades)}` : ''}`;

      const conversationHistory = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            ...conversationHistory,
            { role: 'user', content: messageText }
          ]
        })
      });

      // Try backend proxy if direct fails
      if (!response.ok) {
        throw new Error('Direct API failed');
      }

      const data = await response.json();
      const aiText = data.content?.[0]?.text || 'Хариулт авах боломжгүй байна.';

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiText,
        timestamp: new Date()
      }]);
    } catch (err) {
      // Fallback to backend
      try {
        const backendResponse = await fetch(`${API_BASE_URL}/ai/chat`, {
          method: 'POST',
          headers: getHeaders(),
          credentials: 'include',
          body: JSON.stringify({
            message: messageText,
            history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
            tradeContext
          })
        });

        if (backendResponse.ok) {
          const data = await backendResponse.json();
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.reply || data.message || 'Хариулт авах боломжгүй байна.',
            timestamp: new Date()
          }]);
        } else {
          throw new Error('Backend also failed');
        }
      } catch (backendErr) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '⚠️ Холболт алдаа гарлаа. Backend дэх `/api/ai/chat` endpoint ажиллаж байгаа эсэхийг шалгана уу.',
          timestamp: new Date(),
          isError: true
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Чат цэвэрлэгдлээ. Шинэ асуулт асуугаарай! 🚀',
      timestamp: new Date()
    }]);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
  };

  const unreadCount = 0; // Could track new messages

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-accent hover:bg-accent-hover text-slate-950 rounded-full shadow-[0_4px_24px_rgba(200,240,122,0.4)] flex items-center justify-center transition-all duration-300 hover:scale-110 z-40 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping absolute" />
          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full relative" />
        </span>
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        } ${isMinimized ? 'h-auto' : ''}`}
        style={{ width: '380px' }}
      >
        <div className={`bg-slate-900 border border-slate-700/60 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden transition-all duration-300 ${isMinimized ? '' : 'h-[560px]'}`}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-700/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-accent" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-950 rounded-full" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-none">AI Зөвлөх</h3>
                <p className="text-[11px] text-emerald-400 mt-0.5">
                  {tradeContext ? `${tradeContext.totalTrades} арилжаа шинжилж байна` : 'Онлайн'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                title="Цэвэрлэх"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(v => !v)}
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      msg.role === 'user'
                        ? 'bg-accent/20 border border-accent/30'
                        : 'bg-slate-800 border border-slate-700'
                    }`}>
                      {msg.role === 'user'
                        ? <User className="w-3.5 h-3.5 text-accent" />
                        : <Bot className="w-3.5 h-3.5 text-slate-300" />
                      }
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-accent text-slate-950 font-medium rounded-tr-sm'
                          : msg.isError
                          ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-tl-sm'
                          : 'bg-slate-700 border border-slate-600 text-white rounded-tl-sm'
                      }`}>
                        {msg.role === 'assistant'
                          ? <MessageContent content={msg.content} />
                          : <span>{msg.content}</span>
                        }
                      </div>
                      {msg.timestamp && (
                        <span className="text-[10px] text-slate-600 px-1">
                          {formatTime(msg.timestamp)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/50 px-4 py-3 rounded-2xl rounded-tl-sm">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                        <span className="text-xs text-slate-500 ml-1">Бодож байна...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick prompts — only show at start */}
              {messages.length <= 1 && (
                <div className="px-4 pb-3 flex flex-wrap gap-1.5 shrink-0">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(prompt)}
                      className="text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-accent/40 text-slate-300 hover:text-accent rounded-lg transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-slate-700/50 bg-slate-950/40 shrink-0">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Асуулт бичнэ үү... (Enter илгээх)"
                      rows={1}
                      className="w-full bg-slate-800 border border-slate-700 focus:border-accent/50 focus:ring-1 focus:ring-accent/30 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 resize-none outline-none transition-all leading-snug"
                      style={{ maxHeight: '80px', overflowY: 'auto' }}
                    />
                  </div>
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="w-9 h-9 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 rounded-xl flex items-center justify-center transition-all shrink-0 hover:scale-105 active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 mt-1.5 text-center">
                  Shift+Enter = мөр эргэх
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
