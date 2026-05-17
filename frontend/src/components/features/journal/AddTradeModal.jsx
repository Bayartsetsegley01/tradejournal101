import { useState, useEffect } from "react";
import { X, Image as ImageIcon, Target, LineChart, Brain, LayoutTemplate, UploadCloud, Check, Plus, Save, AlertCircle } from "lucide-react";
import { MARKET_TYPES, EMOTIONS, POSITIVE_TAGS, MISTAKE_TAGS, SESSIONS } from "@/lib/constants";
import { CustomTagModal } from "./CustomTagModal";
import { tradeService } from "@/services/tradeService";
import { tagService } from "@/services/tagService";
import { emotionService } from "@/services/emotionService";

export function AddTradeModal({ isOpen, onClose, initialData = null, accountId = null }) {
  const [customTagModal, setCustomTagModal] = useState(null);

  const [customEmotions, setCustomEmotions] = useState([]);
  const [customPositiveTags, setCustomPositiveTags] = useState([]);
  const [customMistakeTags, setCustomMistakeTags] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    emotionService.getEmotions().then(res => {
      if (res?.data) {
        const dbEmotions = res.data.map(e => ({ id: e.id, label: e.name, emoji: e.emoji || '' }));
        setCustomEmotions(dbEmotions);
      }
    }).catch(() => {});
    tagService.getTags().then(res => {
      if (res?.data) {
        const pos = res.data.filter(t => t.type === 'POSITIVE').map(t => ({ id: t.id, label: t.name }));
        const mis = res.data.filter(t => t.type === 'MISTAKE').map(t => ({ id: t.id, label: t.name }));
        setCustomPositiveTags(pos);
        setCustomMistakeTags(mis);
      }
    }).catch(() => {});
  }, [isOpen]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const toLocalISO = (d = new Date()) =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    date: toLocalISO(),
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

  useEffect(() => {
    const timer = setInterval(() => {
      if (!initialData && formData.symbol) {
        localStorage.setItem('trade_draft', JSON.stringify(formData));
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [formData, initialData]);

  useEffect(() => {
    if (!initialData) {
      const draft = localStorage.getItem('trade_draft');
      if (draft) {
        try { setFormData(JSON.parse(draft)); } catch (e) {}
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (!formData.entry || !formData.stopLoss) return;
    const entry = parseFloat(formData.entry);
    const sl = parseFloat(formData.stopLoss);
    if (isNaN(entry) || isNaN(sl)) return;

    if (!initialData && !formData.takeProfit) {
      const riskPerShare = Math.abs(entry - sl);
      const suggestedTp = formData.direction === 'LONG'
        ? entry + (riskPerShare * 2)
        : entry - (riskPerShare * 2);
      if (suggestedTp > 0) {
        setFormData(prev => ({ ...prev, takeProfit: suggestedTp.toFixed(5) }));
      }
    }

    const riskPercent = parseFloat(formData.riskPercent);
    const balance = parseFloat(formData.accountBalance);
    if (!isNaN(riskPercent) && !isNaN(balance) && riskPercent > 0 && balance > 0) {
      if (!formData.quantity || formData.quantity === '') {
        const riskAmount = balance * (riskPercent / 100);
        const riskPerShare = Math.abs(entry - sl);
        if (riskPerShare > 0) {
          setFormData(prev => ({ ...prev, quantity: (riskAmount / riskPerShare).toFixed(2) }));
        }
      }
    }
  }, [formData.entry, formData.stopLoss, formData.direction, formData.riskPercent, formData.accountBalance, formData.quantity, formData.takeProfit, initialData]);

  useEffect(() => {
    if (initialData) {
      let formattedDate = toLocalISO();
      try {
        const raw = initialData.date || initialData.entry_date;
        if (raw) {
          const d = new Date(raw);
          if (!isNaN(d.getTime())) formattedDate = toLocalISO(d);
        }
      } catch (e) {}

      let formattedExpiry = '';
      try {
        const raw = initialData.expiry || initialData.expiry_date;
        if (raw) {
          const d = new Date(raw);
          if (!isNaN(d.getTime())) formattedExpiry = d.toISOString().slice(0, 10);
        }
      } catch (e) {}

      const parseTags = (v) => {
        if (Array.isArray(v)) return v;
        if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
        return [];
      };

      setFormData(prev => ({
        ...prev,
        ...initialData,
        date:          formattedDate,
        expiry:        formattedExpiry,
        entry:         initialData.entry_price   ?? initialData.entry         ?? '',
        exit:          initialData.exit_price    ?? initialData.exit          ?? '',
        stopLoss:      initialData.stop_loss     ?? initialData.stopLoss      ?? '',
        takeProfit:    initialData.take_profit   ?? initialData.takeProfit    ?? '',
        quantity:      initialData.position_size ?? initialData.quantity      ?? '',
        market:        initialData.market_type   || initialData.market        || 'forex',
        emotionBefore: initialData.emotionBefore || initialData.emotion_before || '',
        emotionAfter:  initialData.emotionAfter  || initialData.emotion_after  || '',
        positiveTags:  parseTags(initialData.positiveTags || initialData.positive_tags),
        mistakeTags:   parseTags(initialData.mistakeTags  || initialData.mistake_tags),
        whyEntered:    initialData.whyEntered    || initialData.why_entered    || '',
        whatHappened:  initialData.whatHappened  || initialData.what_happened  || '',
        whatWentWell:  initialData.whatWentWell  || initialData.what_went_well || '',
        mistakesMade:  initialData.mistakesMade  || initialData.mistakes_made  || '',
        lessonLearned: initialData.lessonLearned || initialData.lessons_learned || '',
        notes:         initialData.notes || '',
        riskPercent:   initialData.riskPercent || (initialData.risk_percent != null ? String(initialData.risk_percent) : ''),
        screenshot_url: initialData.screenshot_url || null,
      }));
    }
  }, [initialData]);

  if (!isOpen) return null;

  const toggleTag = (type, tagId) => {
    setFormData(prev => {
      const tags = prev[type];
      if (tags.includes(tagId)) return { ...prev, [type]: tags.filter(t => t !== tagId) };
      return { ...prev, [type]: [...tags, tagId] };
    });
  };

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
    if (!isDraft && validationError) { setSaveError(validationError); return; }
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        status: isDraft ? 'DRAFT' : (formData.status || 'CLOSED'),
        market_type: formData.market,
        entry_date: formData.date,
        account_id: accountId || null,
      };
      if (payload.id) {
        await tradeService.updateTrade(payload.id, payload);
      } else {
        await tradeService.createTrade(payload);
      }
      if (payload.status === 'CLOSED' && pnl) {
        const currentBalance = parseFloat(localStorage.getItem('account_balance') || '10000');
        const newBalance = currentBalance + parseFloat(pnl);
        localStorage.setItem('account_balance', newBalance.toString());
      }
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
    const exitPrice = formData.status === 'CLOSED' && formData.exit
      ? parseFloat(formData.exit)
      : parseFloat(formData.takeProfit);
    if (isNaN(entry) || isNaN(exitPrice) || isNaN(qty)) return null;
    const diff = formData.direction === 'LONG' ? exitPrice - entry : entry - exitPrice;
    const market = (formData.market || 'forex').toLowerCase();
    if (market === 'forex') {
      if (entry < 10) { const pips = diff / 0.0001; return (pips * 10 * qty).toFixed(2); }
      else if (entry < 500) { const pips = diff / 0.01; return (pips * 10 * qty).toFixed(2); }
    }
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

  const warnings = [];
  if (formData.riskPercent && parseFloat(formData.riskPercent) > 3) warnings.push("Risk is higher than 3%!");
  if (!formData.stopLoss && formData.entry) warnings.push("No Stop Loss set!");
  if (rr && parseFloat(rr) < 1) warnings.push("Risk/Reward ratio is less than 1!");

  const handleCustomTagSave = async (newTag) => {
    try {
      if (customTagModal.type === 'emotion') {
        const result = await emotionService.createEmotion({ name: newTag.label, emoji: newTag.emoji, color: newTag.color });
        const savedTag = result.data;
        const newEntry = { id: savedTag.id, label: savedTag.name, emoji: savedTag.emoji || '' };
        setCustomEmotions(prev => [...prev, newEntry]);
        setFormData(prev => ({ ...prev, emotionBefore: savedTag.id }));
      } else {
        const result = await tagService.createTag({
          type: customTagModal.type === 'positive' ? 'POSITIVE' : 'MISTAKE',
          name: newTag.label, label: newTag.label, color: newTag.color
        });
        const savedTag = result.data;
        const newEntry = { id: savedTag.id, label: savedTag.name };
        if (customTagModal.type === 'positive') {
          setCustomPositiveTags(prev => [...prev, newEntry]);
          toggleTag('positiveTags', savedTag.id);
        } else {
          setCustomMistakeTags(prev => [...prev, newEntry]);
          toggleTag('mistakeTags', savedTag.id);
        }
      }
    } catch (err) {
      console.error("Failed to save custom tag", err);
    }
  };

  const allEmotions = customEmotions.length > 0 ? customEmotions : EMOTIONS;
  const allPositiveTags = customPositiveTags.length > 0 ? customPositiveTags : POSITIVE_TAGS;
  const allMistakeTags = customMistakeTags.length > 0 ? customMistakeTags : MISTAKE_TAGS;

  const inputCls = "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all text-sm font-mono";
  const labelCls = "block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide";
  const sectionCls = "px-5 py-4 border-b border-slate-800/60";
  const sectionTitleCls = "text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 w-full max-w-[540px] bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">{initialData ? 'Арилжаа засах' : 'Шинэ арилжаа нэмэх'}</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Доош гүйлгэн бүх хэсгийг бөглөнө үү</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* ── SECTION 1: Зах зээл & Үндсэн мэдээлэл ── */}
          <div className={sectionCls}>
            <p className={sectionTitleCls}><Target className="w-3 h-3" /> Зах зээл & Чиглэл</p>

            {/* Market Type */}
            <div className="mb-4">
              <label className={labelCls}>Зах зээлийн төрөл</label>
              <div className="flex flex-wrap gap-1.5">
                {MARKET_TYPES.map(m => (
                  <button key={m.id} onClick={() => setFormData({ ...formData, market: m.id })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      formData.market === m.id
                        ? 'bg-accent/10 border-accent/50 text-accent'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}>{m.label}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelCls}>Огноо, Цаг</label>
                <input type="datetime-local" className={inputCls} value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div>
                <label className={labelCls}>Symbol / Asset</label>
                <input type="text" placeholder="EURUSD, BTC, AAPL" className={`${inputCls} uppercase`} value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})} />
              </div>
            </div>

            {/* Direction */}
            <div className="mb-3">
              <label className={labelCls}>Чиглэл</label>
              <div className="flex gap-2">
                <button onClick={() => setFormData({ ...formData, direction: 'LONG' })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                    formData.direction === 'LONG'
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}>LONG ↑</button>
                <button onClick={() => setFormData({ ...formData, direction: 'SHORT' })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                    formData.direction === 'SHORT'
                      ? 'bg-rose-500/10 border-rose-500/50 text-rose-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}>SHORT ↓</button>
              </div>
            </div>

            {/* Status */}
            <div className="mb-3">
              <label className={labelCls}>Төлөв</label>
              <div className="flex gap-2">
                {['PLANNED', 'OPEN', 'CLOSED'].map(s => (
                  <button key={s} onClick={() => setFormData({ ...formData, status: s })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                      formData.status === s ? 'bg-slate-800 border-slate-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}>{s}</button>
                ))}
              </div>
            </div>

            {/* Dynamic fields by market */}
            {(formData.market === 'forex' || formData.market === 'indices' || formData.market === 'gold') && (
              <div>
                <label className={labelCls}>Trading Session</label>
                <div className="flex flex-wrap gap-2">
                  {SESSIONS.map(s => (
                    <button key={s.id} onClick={() => setFormData({ ...formData, session: s.id })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        formData.session === s.id ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                      }`}>{s.label}</button>
                  ))}
                </div>
              </div>
            )}
            {formData.market === 'crypto' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Exchange</label>
                  <input type="text" placeholder="Binance, Bybit" className={inputCls} value={formData.exchange} onChange={e => setFormData({...formData, exchange: e.target.value})} />
                </div>
                <div>
                  <label className={labelCls}>Leverage (x)</label>
                  <input type="number" placeholder="10" className={inputCls} value={formData.leverage} onChange={e => setFormData({...formData, leverage: e.target.value})} />
                </div>
              </div>
            )}
            {formData.market === 'options' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Option Type</label>
                  <div className="flex gap-2">
                    {['CALL', 'PUT'].map(type => (
                      <button key={type} onClick={() => setFormData({ ...formData, optionType: type })}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                          formData.optionType === type ? 'bg-slate-800 border-slate-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}>{type}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Strike Price</label>
                  <input type="number" className={inputCls} value={formData.strike} onChange={e => setFormData({...formData, strike: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Expiry Date</label>
                  <input type="date" className={inputCls} value={formData.expiry || ''} onChange={e => setFormData({...formData, expiry: e.target.value})} />
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 2: Execution & Risk ── */}
          <div className={sectionCls}>
            <p className={sectionTitleCls}><LineChart className="w-3 h-3" /> Гүйцэтгэл & Эрсдэл</p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelCls}>Entry Price</label>
                <input type="number" step="any" className={`${inputCls} text-white`} value={formData.entry} onChange={e => setFormData({...formData, entry: e.target.value})} />
              </div>
              <div>
                <label className={labelCls}>Exit Price <span className="text-slate-600 normal-case font-normal">(optional)</span></label>
                <input type="number" step="any" className={inputCls} value={formData.exit} onChange={e => setFormData({...formData, exit: e.target.value})} />
              </div>
              <div>
                <label className={labelCls}>Stop Loss</label>
                <input type="number" step="any" className={`${inputCls} text-rose-400`} value={formData.stopLoss} onChange={e => setFormData({...formData, stopLoss: e.target.value})} />
              </div>
              <div>
                <label className={labelCls}>Take Profit</label>
                <input type="number" step="any" className={`${inputCls} text-emerald-400`} value={formData.takeProfit} onChange={e => setFormData({...formData, takeProfit: e.target.value})} />
              </div>
              <div>
                <label className={labelCls}>Quantity / Lot</label>
                <input type="number" step="any" placeholder="0.5" className={inputCls} value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
              </div>
              <div>
                <label className={labelCls}>Risk %</label>
                <div className="relative">
                  <input type="number" step="any" placeholder="1.0" className={`${inputCls} pr-8`} value={formData.riskPercent} onChange={e => setFormData({...formData, riskPercent: e.target.value})} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Account Balance</label>
              <input type="number" step="any" className={inputCls} value={formData.accountBalance}
                onChange={e => { setFormData({...formData, accountBalance: e.target.value}); localStorage.setItem('account_balance', e.target.value); }} />
            </div>

            {/* Auto calculations */}
            <div className="mt-3 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">R/R Харьцаа</div>
                  <div className="text-lg font-mono font-bold text-white">{rr ? `${rr}R` : '—'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Est. P&L</div>
                  <div className={`text-lg font-mono font-bold ${pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-rose-400' : 'text-white'}`}>
                    {pnl ? `${pnl > 0 ? '+' : ''}$${pnl}` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Risk $</div>
                  <div className="text-lg font-mono font-bold text-rose-400">{riskAmount ? `$${riskAmount}` : '—'}</div>
                </div>
              </div>
              {warnings.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {warnings.map((w, i) => (
                    <div key={i} className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs p-2.5 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION 3: Psychology & Tags ── */}
          <div className={sectionCls}>
            <p className={sectionTitleCls}><Brain className="w-3 h-3" /> Сэтгэл зүй & Үнэлгээ</p>

            <div className="mb-4">
              <label className={labelCls}>Орох үеийн сэтгэл зүй</label>
              <div className="flex flex-wrap gap-1.5">
                {allEmotions.map(e => (
                  <button key={`before-${e.id}`} onClick={() => setFormData({ ...formData, emotionBefore: e.id })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${
                      formData.emotionBefore === e.id ? 'bg-slate-800 border-slate-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}><span>{e.emoji}</span>{e.label}</button>
                ))}
                <button onClick={() => setCustomTagModal({ type: 'emotion' })}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-950 text-slate-500 border border-dashed border-slate-700 hover:border-slate-500 hover:text-slate-300 transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Нэмэх
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className={labelCls}>Гарах үеийн сэтгэл зүй</label>
              <div className="flex flex-wrap gap-1.5">
                {allEmotions.map(e => (
                  <button key={`after-${e.id}`} onClick={() => setFormData({ ...formData, emotionAfter: e.id })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${
                      formData.emotionAfter === e.id ? 'bg-slate-800 border-slate-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}><span>{e.emoji}</span>{e.label}</button>
                ))}
                <button onClick={() => setCustomTagModal({ type: 'emotion' })}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-950 text-slate-500 border border-dashed border-slate-700 hover:border-slate-500 hover:text-slate-300 transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Нэмэх
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">
                <Check className="w-3 h-3" /> Давуу тал (Positive Tags)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {allPositiveTags.map(t => {
                  const isSelected = formData.positiveTags.includes(t.id);
                  return (
                    <button key={t.id} onClick={() => toggleTag('positiveTags', t.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                        isSelected ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                      }`}>{t.label}</button>
                  );
                })}
                <button onClick={() => setCustomTagModal({ type: 'positive' })}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-950 text-slate-500 border border-dashed border-slate-700 hover:border-slate-500 hover:text-slate-300 transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Нэмэх
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 uppercase tracking-wide mb-2">
                <X className="w-3 h-3" /> Алдаа (Mistake Tags)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {allMistakeTags.map(t => {
                  const isSelected = formData.mistakeTags.includes(t.id);
                  return (
                    <button key={t.id} onClick={() => toggleTag('mistakeTags', t.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                        isSelected ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                      }`}>{t.label}</button>
                  );
                })}
                <button onClick={() => setCustomTagModal({ type: 'mistake' })}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-950 text-slate-500 border border-dashed border-slate-700 hover:border-slate-500 hover:text-slate-300 transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Нэмэх
                </button>
              </div>
            </div>
          </div>

          {/* ── SECTION 4: Journal & Media ── */}
          <div className="px-5 py-4">
            <p className={sectionTitleCls}><LayoutTemplate className="w-3 h-3" /> Тэмдэглэл & Зураг</p>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Яагаад орсон бэ?</label>
                <textarea rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 resize-none transition-all"
                  placeholder="Setup, дохио, шалтгаан..."
                  value={formData.whyEntered} onChange={e => setFormData({...formData, whyEntered: e.target.value})} />
              </div>
              <div>
                <label className={labelCls}>Юу болсон бэ?</label>
                <textarea rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 resize-none transition-all"
                  placeholder="Зах зээл хэрхэн хөдөлсөн, TP/SL-д хүрсэн эсэх..."
                  value={formData.whatHappened} onChange={e => setFormData({...formData, whatHappened: e.target.value})} />
              </div>
              <div>
                <label className={labelCls}>Юу сурсан бэ?</label>
                <textarea rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 resize-none transition-all"
                  placeholder="Сургамж, дараа анхаарах зүйл..."
                  value={formData.lessonLearned} onChange={e => setFormData({...formData, lessonLearned: e.target.value})} />
              </div>

              {/* Screenshot */}
              <div>
                <label className={labelCls}>Screenshot</label>
                {formData.screenshot_url ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 group">
                    <img src={formData.screenshot_url} alt="Trade Screenshot" className="w-full h-auto max-h-[240px] object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg cursor-pointer">
                        Солих
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData({...formData, screenshot_url: reader.result}); reader.readAsDataURL(file); }
                        }} />
                      </label>
                      <button onClick={() => setFormData({...formData, screenshot_url: null})} className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-medium rounded-lg">Устгах</button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-700 hover:border-accent/50 bg-slate-950/50 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group">
                    <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-accent mb-2 transition-colors" />
                    <p className="text-sm text-slate-400">Зураг оруулах эсвэл Drag & Drop</p>
                    <p className="text-xs text-slate-600 mt-1">PNG, JPG, GIF (Max 5MB)</p>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData({...formData, screenshot_url: reader.result}); reader.readAsDataURL(file); }
                    }} />
                  </label>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 shrink-0 space-y-2">
          {saveError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{saveError}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => handleSave(true)} disabled={isSaving}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 border border-slate-700">
              <Save className="w-4 h-4" />{isSaving ? '...' : 'Ноорог'}
            </button>
            <button onClick={() => handleSave(false)} disabled={isSaving}
              className="flex-1 bg-accent hover:bg-accent-hover text-slate-950 text-sm font-bold py-2.5 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(200,240,122,0.2)] disabled:opacity-50 flex items-center justify-center">
              {isSaving ? <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" /> : 'Бүртгэх'}
            </button>
          </div>
        </div>

      </div>

      {customTagModal && (
        <CustomTagModal type={customTagModal.type} onClose={() => setCustomTagModal(null)} onSave={handleCustomTagSave} />
      )}
    </div>
  );
}
