import { useState, useEffect } from "react";
import { X, Image as ImageIcon, Target, LineChart, Brain, LayoutTemplate, UploadCloud, Check, Plus, Save, AlertCircle } from "lucide-react";
import { MARKET_TYPES, EMOTIONS, POSITIVE_TAGS, MISTAKE_TAGS, SESSIONS } from "@/lib/constants";
import { CustomTagModal } from "./CustomTagModal";
import { tradeService } from "@/services/tradeService";
import { tagService } from "@/services/tagService";

const TABS = [
  { id: 'setup', label: 'Setup & Market', icon: Target, description: 'Зах зээл болон чиглэл' },
  { id: 'execution', label: 'Execution & Risk', icon: LineChart, description: 'Үнэ болон эрсдэл' },
  { id: 'psychology', label: 'Psychology & Tags', icon: Brain, description: 'Сэтгэл зүй, алдаа' },
  { id: 'journal', label: 'Journal & Media', icon: LayoutTemplate, description: 'Тэмдэглэл, зураг' },
];

export function AddTradeModal({ isOpen, onClose, initialData = null }) {
  const [activeTab, setActiveTab] = useState('setup');
  const [customTagModal, setCustomTagModal] = useState(null); // { type: 'emotion' | 'positive' | 'mistake' }
  
  // Custom tags state (mocking DB)
  const [customEmotions, setCustomEmotions] = useState([]);
  const [customPositiveTags, setCustomPositiveTags] = useState([]);
  const [customMistakeTags, setCustomMistakeTags] = useState([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16),
    status: 'PLANNED',
    market: 'forex',
    symbol: '',
    direction: 'LONG',
    session: '',
    exchange: '',
    leverage: '',
    strike: '',
    expiry: '',
    optionType: 'CALL',
    sector: '',
    entry: '',
    exit: '',
    stopLoss: '',
    takeProfit: '',
    quantity: '',
    riskPercent: '',
    accountBalance: localStorage.getItem('account_balance') || '10000',
    emotionBefore: '',
    emotionAfter: '',
    positiveTags: [],
    mistakeTags: [],
    setupDescription: '',
    whyEntered: '',
    whatHappened: '',
    mistakesMade: '',
    whatWentWell: '',
    lessonLearned: '',
    screenshot_url: null,
  });

  // Auto-save draft every 2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (!initialData && formData.symbol) {
        localStorage.setItem('trade_draft', JSON.stringify(formData));
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [formData, initialData]);

  // Load draft on mount if no initialData
  useEffect(() => {
    if (!initialData) {
      const draft = localStorage.getItem('trade_draft');
      if (draft) {
        try {
          setFormData(JSON.parse(draft));
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
  }, [initialData]);

  // Smart TP Suggestion and Auto Lot Size
  useEffect(() => {
    if (formData.entry && formData.stopLoss) {
      const entry = parseFloat(formData.entry);
      const sl = parseFloat(formData.stopLoss);
      const riskPercent = parseFloat(formData.riskPercent);
      const balance = parseFloat(formData.accountBalance);

      if (!isNaN(entry) && !isNaN(sl)) {
        // Smart TP Suggestion (if TP is empty)
        if (!formData.takeProfit) {
          const riskPerShare = Math.abs(entry - sl);
          const suggestedTp = formData.direction === 'LONG' 
            ? entry + (riskPerShare * 2) 
            : entry - (riskPerShare * 2);
          
          if (suggestedTp > 0) {
            setFormData(prev => ({ ...prev, takeProfit: suggestedTp.toFixed(5) }));
          }
        }

        // Auto Lot Size
        if (!isNaN(riskPercent) && !isNaN(balance) && riskPercent > 0 && balance > 0) {
          const riskAmount = balance * (riskPercent / 100);
          const riskPerShare = Math.abs(entry - sl);
          if (riskPerShare > 0) {
            const lotSize = riskAmount / riskPerShare;
            if (!formData.quantity || formData.quantity === '') {
              setFormData(prev => ({ ...prev, quantity: lotSize.toFixed(2) }));
            }
          }
        }
      }
    }
  }, [formData.entry, formData.stopLoss, formData.direction, formData.riskPercent, formData.accountBalance, formData.quantity, formData.takeProfit]);

  useEffect(() => {
    if (initialData) {
      // Safely format date for datetime-local input
      let formattedDate = new Date().toISOString().slice(0, 16);
      try {
        if (initialData.date) {
          const d = new Date(initialData.date);
          if (!isNaN(d.getTime())) formattedDate = d.toISOString().slice(0, 16);
        } else if (initialData.entry_date) {
          const d = new Date(initialData.entry_date);
          if (!isNaN(d.getTime())) formattedDate = d.toISOString().slice(0, 16);
        }
      } catch (e) {
        console.warn("Invalid date format", e);
      }

      let formattedExpiry = initialData.expiry || '';
      if (formattedExpiry) {
        try {
          const d = new Date(formattedExpiry);
          if (!isNaN(d.getTime())) {
            formattedExpiry = d.toISOString().slice(0, 10);
          } else {
            formattedExpiry = '';
          }
        } catch (e) {
          console.warn("Invalid expiry format", e);
          formattedExpiry = '';
        }
      }

      setFormData(prev => ({ 
        ...prev, 
        ...initialData,
        date: formattedDate,
        expiry: formattedExpiry
      }));
    }
  }, [initialData]);

  if (!isOpen) return null;

  const toggleTag = (type, tagId) => {
    setFormData(prev => {
      const tags = prev[type];
      if (tags.includes(tagId)) {
        return { ...prev, [type]: tags.filter(t => t !== tagId) };
      } else {
        return { ...prev, [type]: [...tags, tagId] };
      }
    });
  };

  useEffect(() => {
    if (isOpen && initialData) {
      // date formatting...
      setFormData(prev => ({ ...prev, ...initialData, date: formattedDate, expiry: formattedExpiry }));
    } else if (isOpen && !initialData) {
      // reset to empty form
      setFormData({
        symbol: '', direction: 'LONG', market: 'FOREX',
        date: new Date().toISOString().slice(0, 16),
        // ...
      });
    }
  }, [initialData, isOpen]);


  const validateForm = () => {
    if (!formData.symbol) return "Симбол (Symbol) оруулна уу";
    if (!formData.entry) return "Орох үнэ (Entry price) оруулна уу";
    if (!formData.stopLoss) return "Алдагдал зогсоох (Stop Loss) оруулна уу";
    if (!formData.takeProfit) return "Ашиг авах (Take Profit) оруулна уу";
    if (!formData.quantity) return "Хэмжээ (Quantity/Lot) оруулна уу";
    if (!formData.whyEntered) return "Яагаад орсон шалтгаанаа бичнэ үү (Setup & Reason)";
    
    if (formData.status === 'CLOSED') {
      if (!formData.exit) return "Хаасан үнэ (Exit price) оруулна уу";
      if (!formData.whatHappened) return "Юу болсныг бичнэ үү (What happened)";
      if (!formData.lessonLearned) return "Юу сурснаа бичнэ үү (Lesson learned)";
    }
    return null;
  };

  const handleSave = async (isDraft = false) => {
    setSaveError(null);
    
    const validationError = validateForm();
    if (!isDraft && validationError) {
      setSaveError(validationError);
      return;
    }

    setIsSaving(true);
    
    try {
      const payload = {
        ...formData,
        status: isDraft ? 'DRAFT' : (formData.status || 'CLOSED'),
        market_type: formData.market,
        entry_date: formData.date,
      };

      if (payload.id) {
        await tradeService.updateTrade(payload.id, payload);
      } else {
        await tradeService.createTrade(payload);
      }

      // Update balance if trade is closed
      if (payload.status === 'CLOSED' && pnl) {
        const currentBalance = parseFloat(localStorage.getItem('account_balance') || '10000');
        const newBalance = currentBalance + parseFloat(pnl);
        localStorage.setItem('account_balance', newBalance.toString());
      }

      // Clear draft
      localStorage.removeItem('trade_draft');
      
      onClose();
    } catch (err) {
      setSaveError(err.message || "Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setIsSaving(false);
    }
  };

  const calculateRR = () => {
    if (!formData.entry || !formData.stopLoss || !formData.takeProfit) return null;
    const entry = parseFloat(formData.entry);
    const sl = parseFloat(formData.stopLoss);
    const tp = parseFloat(formData.takeProfit);
    if (isNaN(entry) || isNaN(sl) || isNaN(tp)) return null;
    
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    if (risk === 0) return null;
    return (reward / risk).toFixed(2);
  };

  const calculatePnL = () => {
    if (!formData.entry || !formData.quantity) return null;
    const entry = parseFloat(formData.entry);
    const qty = parseFloat(formData.quantity);
    
    // If trade is closed, use exit price. Otherwise use take profit for estimated PnL
    const exitPrice = formData.status === 'CLOSED' && formData.exit ? parseFloat(formData.exit) : parseFloat(formData.takeProfit);
    
    if (isNaN(entry) || isNaN(exitPrice) || isNaN(qty)) return null;

    const diff = formData.direction === 'LONG' ? exitPrice - entry : entry - exitPrice;
    return (diff * qty).toFixed(2);
  };

  const calculateRiskAmount = () => {
    if (!formData.accountBalance || !formData.riskPercent) return null;
    const balance = parseFloat(formData.accountBalance);
    const riskPct = parseFloat(formData.riskPercent);
    if (isNaN(balance) || isNaN(riskPct)) return null;
    return (balance * (riskPct / 100)).toFixed(2);
  };

  const rr = calculateRR();
  const pnl = calculatePnL();
  const riskAmount = calculateRiskAmount();
  
  // Warnings
  const warnings = [];
  if (formData.riskPercent && parseFloat(formData.riskPercent) > 3) {
    warnings.push("Risk is higher than 3%!");
  }
  if (!formData.stopLoss && formData.entry) {
    warnings.push("No Stop Loss set!");
  }
  if (rr && parseFloat(rr) < 1) {
    warnings.push("Risk/Reward ratio is less than 1!");
  }

  const handleCustomTagSave = async (newTag) => {
    try {
      const result = await tagService.createTag({
        type: customTagModal.type,
        label: newTag.label,
        emoji: newTag.emoji,
        color: newTag.color
      });
      
      const savedTag = result.data;

      if (customTagModal.type === 'emotion') {
        setCustomEmotions([...customEmotions, savedTag]);
        setFormData(prev => ({ ...prev, emotionBefore: savedTag.id })); // Auto select
      } else if (customTagModal.type === 'positive') {
        setCustomPositiveTags([...customPositiveTags, savedTag]);
        toggleTag('positiveTags', savedTag.id);
      } else if (customTagModal.type === 'mistake') {
        setCustomMistakeTags([...customMistakeTags, savedTag]);
        toggleTag('mistakeTags', savedTag.id);
      }
    } catch (err) {
      console.error("Failed to save custom tag", err);
    }
  };

  const allEmotions = [...EMOTIONS, ...customEmotions];
  const allPositiveTags = [...POSITIVE_TAGS, ...customPositiveTags];
  const allMistakeTags = [...MISTAKE_TAGS, ...customMistakeTags];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-72 bg-slate-950/50 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between md:block">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{initialData ? 'Арилжаа засах' : 'Шинэ арилжаа'}</h2>
              <p className="text-xs text-slate-500 mt-1">AI анализ хийхэд зориулагдсан</p>
            </div>
            <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-x-auto md:overflow-y-auto p-4 flex md:flex-col gap-2 custom-scrollbar">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl text-left transition-all min-w-[200px] md:min-w-0 ${
                    isActive 
                      ? 'bg-emerald-500/10 border border-emerald-500/20 shadow-sm' 
                      : 'border border-transparent hover:bg-slate-800/50'
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    <tab.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${isActive ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {tab.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 hidden md:block">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-800 space-y-3 hidden md:block">
            {saveError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{saveError}</span>
              </div>
            )}
            <button 
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Хадгалж байна...' : 'Ноорог (Draft) хадгалах'}
            </button>
            <button 
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="w-full bg-accent hover:bg-accent-hover text-slate-950 text-sm font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(200,240,122,0.2)] hover:shadow-[0_0_20px_rgba(200,240,122,0.4)] disabled:opacity-50 flex items-center justify-center"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                'Бүртгэх'
              )}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-[60vh] md:h-auto overflow-hidden bg-slate-900">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            
            {/* TAB 1: Setup & Market */}
            {activeTab === 'setup' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* Market Type */}
                <section>
                  <label className="block text-sm font-semibold text-white mb-3">Зах зээлийн төрөл</label>
                  <div className="flex flex-wrap gap-2">
                    {MARKET_TYPES.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setFormData({ ...formData, market: m.id })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                          formData.market === m.id 
                            ? 'bg-accent/10 border-accent/50 text-accent shadow-[0_0_15px_rgba(200,240,122,0.1)]' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </section>

                <div className="h-px bg-slate-800/50" />

                {/* Basic Info */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Account Balance</label>
                    <input 
                      type="number" 
                      step="any"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-mono"
                      value={formData.accountBalance}
                      onChange={e => {
                        setFormData({...formData, accountBalance: e.target.value});
                        localStorage.setItem('account_balance', e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Огноо, Цаг</label>
                    <input 
                      type="datetime-local" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-medium"
                      value={formData.date || ''}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Арилжааны төлөв</label>
                    <div className="flex gap-2">
                      {['PLANNED', 'OPEN', 'CLOSED'].map(status => (
                        <button
                          key={status}
                          onClick={() => setFormData({ ...formData, status })}
                          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${
                            formData.status === status 
                              ? 'bg-slate-800 border-slate-500 text-white shadow-sm' 
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Symbol / Asset</label>
                    <input 
                      type="text" 
                      placeholder="e.g. EURUSD, BTC, AAPL"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-medium uppercase"
                      value={formData.symbol}
                      onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Direction</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setFormData({ ...formData, direction: 'LONG' })}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${
                          formData.direction === 'LONG' 
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        LONG
                      </button>
                      <button
                        onClick={() => setFormData({ ...formData, direction: 'SHORT' })}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${
                          formData.direction === 'SHORT' 
                            ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        SHORT
                      </button>
                    </div>
                  </div>
                </section>

                {/* Dynamic Fields */}
                <section className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-5">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Нэмэлт мэдээлэл ({formData.market})</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {(formData.market === 'forex' || formData.market === 'indices' || formData.market === 'gold') && (
                      <div className="col-span-full">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Trading Session</label>
                        <div className="flex flex-wrap gap-3">
                          {SESSIONS.map(s => (
                            <button
                              key={s.id}
                              onClick={() => setFormData({ ...formData, session: s.id })}
                              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                formData.session === s.id 
                                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' 
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.market === 'crypto' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Exchange</label>
                          <input type="text" placeholder="e.g. Binance, Bybit" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none" value={formData.exchange} onChange={e => setFormData({...formData, exchange: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Leverage (x)</label>
                          <input type="number" placeholder="e.g. 10" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none font-mono" value={formData.leverage} onChange={e => setFormData({...formData, leverage: e.target.value})} />
                        </div>
                      </>
                    )}

                    {formData.market === 'options' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Option Type</label>
                          <div className="flex gap-2">
                            {['CALL', 'PUT'].map(type => (
                              <button
                                key={type}
                                onClick={() => setFormData({ ...formData, optionType: type })}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                                  formData.optionType === type ? 'bg-slate-800 border-slate-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Strike Price</label>
                          <input type="number" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none font-mono" value={formData.strike} onChange={e => setFormData({...formData, strike: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Expiry Date</label>
                          <input type="date" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none" value={formData.expiry || ''} onChange={e => setFormData({...formData, expiry: e.target.value})} />
                        </div>
                      </>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* TAB 2: Execution & Risk */}
            {activeTab === 'execution' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                
                <section className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" /> Entry & Exit
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Entry Price</label>
                      <input type="number" step="any" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none font-mono text-lg" value={formData.entry} onChange={e => setFormData({...formData, entry: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Exit Price <span className="text-slate-500 font-normal text-xs ml-1">(Optional)</span></label>
                      <input type="number" step="any" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none font-mono text-lg" value={formData.exit} onChange={e => setFormData({...formData, exit: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-400" /> Risk Management
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Stop Loss</label>
                      <input type="number" step="any" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-rose-400 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none font-mono text-lg" value={formData.stopLoss} onChange={e => setFormData({...formData, stopLoss: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Take Profit</label>
                      <input type="number" step="any" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-emerald-400 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none font-mono text-lg" value={formData.takeProfit} onChange={e => setFormData({...formData, takeProfit: e.target.value})} />
                    </div>
                  </div>
                </section>

                <div className="h-px bg-slate-800/50" />

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Quantity / Lot Size</label>
                    <input type="number" step="any" placeholder="e.g. 0.5" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none font-mono" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Risk % <span className="text-slate-500 font-normal text-xs ml-1">(Account risk)</span></label>
                    <div className="relative">
                      <input type="number" step="any" placeholder="1.0" className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none font-mono" value={formData.riskPercent} onChange={e => setFormData({...formData, riskPercent: e.target.value})} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">%</span>
                    </div>
                  </div>
                </section>

                {/* Auto Calculations */}
                <section className="bg-slate-950/50 border border-slate-800 rounded-xl p-6">
                  <h4 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Auto Calculations</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-slate-500 mb-1">Risk/Reward (R/R)</div>
                      <div className="text-2xl font-mono font-bold text-white">
                        {rr ? `${rr}R` : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 mb-1">Est. P&L</div>
                      <div className={`text-2xl font-mono font-bold ${pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-rose-400' : 'text-white'}`}>
                        {pnl ? `${pnl > 0 ? '+' : ''}$${pnl}` : '-'}
                      </div>
                    </div>
                    {riskAmount && (
                      <div className="col-span-2">
                        <div className="text-sm text-slate-500 mb-1">Risk Amount</div>
                        <div className="text-lg font-mono font-bold text-rose-400">
                          ${riskAmount}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {warnings.length > 0 && (
                    <div className="mt-6 space-y-2">
                      {warnings.map((w, i) => (
                        <div key={i} className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs p-3 rounded-xl flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* TAB 3: Psychology & Tags */}
            {activeTab === 'psychology' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                
                <section>
                  <h3 className="text-lg font-semibold text-white mb-6">Сэтгэл зүйн байдал</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-3">Орох үеийн сэтгэл зүй (Before)</label>
                      <div className="flex flex-wrap gap-2">
                        {allEmotions.map(e => (
                          <button
                            key={`before-${e.id}`}
                            onClick={() => setFormData({ ...formData, emotionBefore: e.id })}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border flex items-center gap-2 ${
                              formData.emotionBefore === e.id 
                                ? 'bg-slate-800 border-slate-500 text-white shadow-sm' 
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-900'
                            }`}
                          >
                            <span className="text-lg">{e.emoji}</span> {e.label}
                          </button>
                        ))}
                        <button 
                          onClick={() => setCustomTagModal({ type: 'emotion' })}
                          className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-950 text-slate-500 border border-dashed border-slate-700 hover:border-slate-500 hover:text-slate-300 transition-all flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> Нэмэх
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-3">Гарах үеийн сэтгэл зүй (After)</label>
                      <div className="flex flex-wrap gap-2">
                        {allEmotions.map(e => (
                          <button
                            key={`after-${e.id}`}
                            onClick={() => setFormData({ ...formData, emotionAfter: e.id })}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border flex items-center gap-2 ${
                              formData.emotionAfter === e.id 
                                ? 'bg-slate-800 border-slate-500 text-white shadow-sm' 
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-900'
                            }`}
                          >
                            <span className="text-lg">{e.emoji}</span> {e.label}
                          </button>
                        ))}
                        <button 
                          onClick={() => setCustomTagModal({ type: 'emotion' })}
                          className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-950 text-slate-500 border border-dashed border-slate-700 hover:border-slate-500 hover:text-slate-300 transition-all flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> Нэмэх
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="h-px bg-slate-800/50" />

                <section>
                  <h3 className="text-lg font-semibold text-white mb-6">Арилжааны үнэлгээ</h3>
                  <div className="space-y-8">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-emerald-400 mb-3">
                        <Check className="w-4 h-4" /> Давуу тал (Positive Tags)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {allPositiveTags.map(t => {
                          const isSelected = formData.positiveTags.includes(t.id);
                          const colorClass = t.isCustom 
                            ? (isSelected ? `bg-${t.color}-500/20 border-${t.color}-500/50 text-${t.color}-400` : `bg-slate-950 border-slate-800 text-slate-400 hover:border-${t.color}-500/30`)
                            : (isSelected ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600');
                          
                          return (
                            <button
                              key={t.id}
                              onClick={() => toggleTag('positiveTags', t.id)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${colorClass}`}
                            >
                              {t.label}
                            </button>
                          );
                        })}
                        <button 
                          onClick={() => setCustomTagModal({ type: 'positive' })}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-950 text-slate-500 border border-dashed border-slate-700 hover:border-slate-500 hover:text-slate-300 transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Нэмэх
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-rose-400 mb-3">
                        <X className="w-4 h-4" /> Алдаа (Mistake Tags)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {allMistakeTags.map(t => {
                          const isSelected = formData.mistakeTags.includes(t.id);
                          const colorClass = t.isCustom 
                            ? (isSelected ? `bg-${t.color}-500/20 border-${t.color}-500/50 text-${t.color}-400` : `bg-slate-950 border-slate-800 text-slate-400 hover:border-${t.color}-500/30`)
                            : (isSelected ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600');
                          
                          return (
                            <button
                              key={t.id}
                              onClick={() => toggleTag('mistakeTags', t.id)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${colorClass}`}
                            >
                              {t.label}
                            </button>
                          );
                        })}
                        <button 
                          onClick={() => setCustomTagModal({ type: 'mistake' })}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-950 text-slate-500 border border-dashed border-slate-700 hover:border-slate-500 hover:text-slate-300 transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Нэмэх
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

              </div>
            )}

            {/* TAB 4: Journal & Media */}
            {activeTab === 'journal' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                
                <section className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Яагаад орсон бэ? (Setup & Reason)</label>
                    <p className="text-xs text-slate-500 mb-3">Техник анализ, фундаменталь шалтгаан, баталгаажуулалтуудаа дэлгэрэнгүй бичнэ үү.</p>
                    <textarea 
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 resize-none transition-all"
                      placeholder="Жишээ нь: 15m дээр liquidity sweep хийгээд CHoCH өгсөн тул FVG дээрээс limit order тавьж орсон..."
                      value={formData.whyEntered}
                      onChange={e => setFormData({...formData, whyEntered: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Юу болсон бэ? (What happened?)</label>
                    <textarea 
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 resize-none transition-all"
                      value={formData.whatHappened}
                      onChange={e => setFormData({...formData, whatHappened: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Юуг сайн хийсэн бэ?</label>
                      <textarea 
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 resize-none transition-all"
                        value={formData.whatWentWell}
                        onChange={e => setFormData({...formData, whatWentWell: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Ямар алдаа гаргасан бэ?</label>
                      <textarea 
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 resize-none transition-all"
                        value={formData.mistakesMade}
                        onChange={e => setFormData({...formData, mistakesMade: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Юу сурсан бэ? (Lesson learned)</label>
                    <p className="text-xs text-slate-500 mb-3">Энэ арилжаанаас авсан сургамж, дараа анхаарах зүйлс.</p>
                    <textarea 
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 resize-none transition-all"
                      placeholder="Жишээ нь: Төлөвлөгөөгөө яг дагасан нь зөв байлаа. Гэхдээ TP-дээ хүрэхээс өмнө сандарсан..."
                      value={formData.lessonLearned}
                      onChange={e => setFormData({...formData, lessonLearned: e.target.value})}
                    />
                  </div>
                </section>

                <div className="h-px bg-slate-800/50" />

                <section>
                  <label className="block text-sm font-semibold text-white mb-2">Screenshot (Зураг)</label>
                  <p className="text-xs text-slate-500 mb-4">TradingView эсвэл платформынхоо зургийг оруулна уу.</p>
                  
                  {formData.screenshot_url ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-700 group">
                      <img src={formData.screenshot_url} alt="Trade Screenshot" className="w-full h-auto max-h-[300px] object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
                          Солих
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setFormData({...formData, screenshot_url: reader.result});
                              reader.readAsDataURL(file);
                            }
                          }} />
                        </label>
                        <button onClick={() => setFormData({...formData, screenshot_url: null})} className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-sm font-medium rounded-lg transition-colors">
                          Устгах
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-700 hover:border-accent/50 bg-slate-950/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group">
                      <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-accent/10 transition-all">
                        <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-accent transition-colors" />
                      </div>
                      <h4 className="text-base font-medium text-white mb-1">Зураг оруулах эсвэл Drag & Drop</h4>
                      <p className="text-sm text-slate-500">PNG, JPG, GIF (Max 5MB)</p>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setFormData({...formData, screenshot_url: reader.result});
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  )}
                </section>

              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-800 bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="hidden md:block text-sm text-slate-500">
              Алхам: <span className="text-white font-medium">{TABS.findIndex(t => t.id === activeTab) + 1}</span> / {TABS.length}
            </div>
            
            {saveError && (
              <div className="md:hidden w-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 md:flex-none px-6 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
              >
                Цуцлах
              </button>
              <button 
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="md:hidden flex-1 px-6 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
              >
                Ноорог
              </button>
              <button 
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="flex-1 md:flex-none bg-accent hover:bg-accent-hover text-slate-950 text-sm font-bold py-2.5 px-8 rounded-xl transition-colors shadow-[0_0_20px_rgba(200,240,122,0.2)] disabled:opacity-50 flex items-center justify-center"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  'Хадгалах'
                )}
              </button>
            </div>
          </div>
        </div>

      </div>

      {customTagModal && (
        <CustomTagModal 
          type={customTagModal.type} 
          onClose={() => setCustomTagModal(null)} 
          onSave={handleCustomTagSave} 
        />
      )}
    </div>
  );
}
