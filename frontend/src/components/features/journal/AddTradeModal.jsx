import { useState, useEffect } from "react";
import {
  X, Image as ImageIcon, Target, LineChart, Brain, LayoutTemplate,
  UploadCloud, Check, Plus, Save, AlertCircle, ChevronDown, ChevronUp, Trash2,
} from "lucide-react";
import { MARKET_TYPES, EMOTIONS, POSITIVE_TAGS, MISTAKE_TAGS, SESSIONS } from "@/lib/constants";
import { CustomTagModal } from "./CustomTagModal";
import { tradeService } from "@/services/tradeService";
import { tagService } from "@/services/tagService";
import { emotionService } from "@/services/emotionService";

// ── Collapsible section wrapper ───────────────────────────────────────────────
function Section({ icon: Icon, title, sectionKey, openSections, onToggle, children, accent }) {
  const isOpen = openSections[sectionKey];
  return (
    <div className={`mx-4 my-2 rounded-2xl border transition-all duration-200 overflow-hidden ${
      isOpen
        ? 'bg-slate-800/30 border-slate-700/60'
        : 'bg-slate-800/10 border-slate-800/40 hover:border-slate-700/50'
    }`}>
      <button
        type="button"
        onClick={() => onToggle(sectionKey)}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-colors group"
      >
        <span className={`text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 ${accent || 'text-slate-300'}`}>
          {Icon && <Icon className="w-3.5 h-3.5 opacity-70" />}
          {title}
        </span>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
          isOpen ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'
        }`}>
          {isOpen
            ? <ChevronUp   className="w-3.5 h-3.5" />
            : <ChevronDown className="w-3.5 h-3.5" />
          }
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-slate-700/40 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Deletable tag chip ────────────────────────────────────────────────────────
function TagChip({ tag, isSelected, onClick, onDelete, colorSelected, colorDefault }) {
  return (
    <div className="relative group/chip">
      <button
        type="button"
        onClick={onClick}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 pr-${onDelete ? '6' : '3'} ${
          isSelected
            ? colorSelected || 'bg-slate-800 border-slate-500 text-white'
            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
        }`}
      >
        {tag.emoji && <span>{tag.emoji}</span>}
        {tag.label}
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(tag.id); }}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover/chip:opacity-100 transition-opacity z-10"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}

export function AddTradeModal({ isOpen, onClose, initialData = null, accountId = null }) {
  const [customTagModal, setCustomTagModal] = useState(null);
  const [customEmotions, setCustomEmotions]         = useState([]);
  const [customPositiveTags, setCustomPositiveTags] = useState([]);
  const [customMistakeTags, setCustomMistakeTags]   = useState([]);

  const [openSections, setOpenSections] = useState({
    market:     true,
    execution:  true,
    psychology: true,
    journal:    false,
  });
  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const [isSaving, setIsSaving]   = useState(false);
  const [saveError, setSaveError] = useState(null);

  const toLocalISO = (d = new Date()) =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    date: toLocalISO(),
    status: 'PLANNED',
    market: 'forex',
    symbol: '',
    direction: 'LONG',
    strategy: '',
    session: '',
    pnl: '',
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
    notes: '',
    screenshot_url: null,
  });

  // ── Fetch custom emotions & tags on open ─────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    emotionService.getEmotions().then(res => {
      if (res?.data) {
        setCustomEmotions(res.data.map(e => ({ id: e.id, label: e.name, emoji: e.emoji || '', isDefault: e.is_default })));
      }
    }).catch(() => {});
    tagService.getTags().then(res => {
      if (res?.data) {
        setCustomPositiveTags(res.data.filter(t => t.type === 'POSITIVE').map(t => ({ id: t.id, label: t.name, isDefault: t.is_default })));
        setCustomMistakeTags(res.data.filter(t => t.type === 'MISTAKE').map(t => ({ id: t.id, label: t.name, isDefault: t.is_default })));
      }
    }).catch(() => {});
  }, [isOpen]);

  // ── Draft auto-save ───────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      if (!initialData && formData.symbol) localStorage.setItem('trade_draft', JSON.stringify(formData));
    }, 2000);
    return () => clearInterval(timer);
  }, [formData, initialData]);

  useEffect(() => {
    if (!initialData) {
      const draft = localStorage.getItem('trade_draft');
      if (draft) { try { setFormData(JSON.parse(draft)); } catch {} }
    }
  }, [initialData]);

  // ── Auto TP / Qty calculation ─────────────────────────────────────────────────
  useEffect(() => {
    if (!formData.entry || !formData.stopLoss) return;
    const entry = parseFloat(formData.entry);
    const sl    = parseFloat(formData.stopLoss);
    if (isNaN(entry) || isNaN(sl)) return;

    if (!initialData && !formData.takeProfit) {
      const riskPerShare = Math.abs(entry - sl);
      const suggestedTp  = formData.direction === 'LONG' ? entry + riskPerShare * 2 : entry - riskPerShare * 2;
      if (suggestedTp > 0) setFormData(prev => ({ ...prev, takeProfit: suggestedTp.toFixed(5) }));
    }

    const riskPercent = parseFloat(formData.riskPercent);
    const balance     = parseFloat(formData.accountBalance);
    if (!isNaN(riskPercent) && !isNaN(balance) && riskPercent > 0 && balance > 0) {
      if (!formData.quantity) {
        const riskAmount   = balance * (riskPercent / 100);
        const riskPerShare = Math.abs(entry - sl);
        if (riskPerShare > 0) setFormData(prev => ({ ...prev, quantity: (riskAmount / riskPerShare).toFixed(2) }));
      }
    }
  }, [formData.entry, formData.stopLoss, formData.direction, formData.riskPercent, formData.accountBalance, formData.quantity, formData.takeProfit, initialData]);

  // ── Load initialData ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!initialData) return;
    let formattedDate = toLocalISO();
    try {
      const raw = initialData.date || initialData.entry_date;
      if (raw) { const d = new Date(raw); if (!isNaN(d)) formattedDate = toLocalISO(d); }
    } catch {}

    const parseTags = (v) => {
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return [];
    };

    setFormData(prev => ({
      ...prev, ...initialData,
      date:          formattedDate,
      session:       (initialData.session || '').toLowerCase(),
      entry:         initialData.entry_price   ?? initialData.entry         ?? '',
      exit:          initialData.exit_price    ?? initialData.exit          ?? '',
      stopLoss:      initialData.stop_loss     ?? initialData.stopLoss      ?? '',
      takeProfit:    initialData.take_profit   ?? initialData.takeProfit    ?? '',
      quantity:      initialData.position_size ?? initialData.quantity      ?? '',
      market:        initialData.market_type   || initialData.market        || 'forex',
      strategy:      initialData.strategy      || '',
      emotionBefore: initialData.emotionBefore || initialData.emotion_before || '',
      emotionAfter:  initialData.emotionAfter  || initialData.emotion_after  || '',
      positiveTags:  parseTags(initialData.positiveTags || initialData.positive_tags),
      mistakeTags:   parseTags(initialData.mistakeTags  || initialData.mistake_tags),
      whyEntered:    initialData.whyEntered    || initialData.why_entered    || '',
      whatHappened:  initialData.whatHappened  || initialData.what_happened  || '',
      whatWentWell:  initialData.whatWentWell  || initialData.what_went_well || '',
      mistakesMade:  initialData.mistakesMade  || initialData.mistakes_made  || '',
      lessonLearned: initialData.lessonLearned || initialData.lessons_learned || '',
      notes:         initialData.notes         || '',
      pnl:           initialData.pnl != null ? initialData.pnl : '',
      riskPercent:   initialData.riskPercent   || (initialData.risk_percent != null ? String(initialData.risk_percent) : ''),
      screenshot_url: initialData.screenshot_url || null,
    }));
  }, [initialData]);

  if (!isOpen) return null;

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));
  const setV = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const toggleTag = (type, tagId) => {
    setFormData(prev => {
      const tags = prev[type];
      return { ...prev, [type]: tags.includes(tagId) ? tags.filter(t => t !== tagId) : [...tags, tagId] };
    });
  };

  // ── Delete handlers ───────────────────────────────────────────────────────────
  const handleDeleteEmotion = async (id) => {
    try {
      await emotionService.deleteEmotion(id);
      setCustomEmotions(prev => prev.filter(e => e.id !== id));
      setFormData(prev => ({
        ...prev,
        emotionBefore: prev.emotionBefore === id ? '' : prev.emotionBefore,
        emotionAfter:  prev.emotionAfter  === id ? '' : prev.emotionAfter,
      }));
    } catch {}
  };

  const handleDeleteTag = async (type, id) => {
    try {
      await tagService.deleteTag(id);
      if (type === 'positive') {
        setCustomPositiveTags(prev => prev.filter(t => t.id !== id));
        setFormData(prev => ({ ...prev, positiveTags: prev.positiveTags.filter(tid => tid !== id) }));
      } else {
        setCustomMistakeTags(prev => prev.filter(t => t.id !== id));
        setFormData(prev => ({ ...prev, mistakeTags: prev.mistakeTags.filter(tid => tid !== id) }));
      }
    } catch {}
  };

  // ── Custom tag save ───────────────────────────────────────────────────────────
  const handleCustomTagSave = async (newTag) => {
    try {
      if (customTagModal.type === 'emotion') {
        const result = await emotionService.createEmotion({ name: newTag.label, emoji: newTag.emoji, color: newTag.color });
        const saved = result.data;
        setCustomEmotions(prev => [...prev, { id: saved.id, label: saved.name, emoji: saved.emoji || '', isDefault: false }]);
        setV('emotionBefore', saved.id);
      } else {
        const result = await tagService.createTag({
          type: customTagModal.type === 'positive' ? 'POSITIVE' : 'MISTAKE',
          name: newTag.label, label: newTag.label, color: newTag.color,
        });
        const saved = result.data;
        const entry = { id: saved.id, label: saved.name, isDefault: false };
        if (customTagModal.type === 'positive') {
          setCustomPositiveTags(prev => [...prev, entry]);
          toggleTag('positiveTags', saved.id);
        } else {
          setCustomMistakeTags(prev => [...prev, entry]);
          toggleTag('mistakeTags', saved.id);
        }
      }
    } catch (err) { console.error('Failed to save custom tag', err); }
  };

  // ── Validation ────────────────────────────────────────────────────────────────
  const validateForm = () => {
    if (!formData.symbol)    return 'Симбол (Symbol) оруулна уу';
    if (!formData.entry)     return 'Орох үнэ (Entry price) оруулна уу';
    if (!formData.stopLoss)  return 'Stop Loss оруулна уу';
    if (!formData.takeProfit) return 'Take Profit оруулна уу';
    if (!formData.quantity)  return 'Хэмжээ (Quantity/Lot) оруулна уу';
    if (!formData.whyEntered) return 'Яагаад орсон шалтгаанаа бичнэ үү';
    if (formData.status === 'CLOSED') {
      if (!formData.exit) return 'Хаасан үнэ (Exit price) оруулна уу';
      if (!formData.whatHappened) return 'Юу болсныг бичнэ үү';
      if (!formData.lessonLearned) return 'Юу сурснаа бичнэ үү';
    }
    return null;
  };

  const handleSave = async (isDraft = false) => {
    setSaveError(null);
    if (!isDraft && validateForm()) { setSaveError(validateForm()); return; }
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        status:      isDraft ? 'DRAFT' : (formData.status || 'CLOSED'),
        market_type: formData.market,
        entry_date:  formData.date,
        account_id:  accountId || null,
      };
      if (payload.id) await tradeService.updateTrade(payload.id, payload);
      else            await tradeService.createTrade(payload);
      localStorage.removeItem('trade_draft');
      onClose();
    } catch (err) {
      setSaveError(err.message || 'Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Calculations ──────────────────────────────────────────────────────────────
  const rr = (() => {
    const e = parseFloat(formData.entry), sl = parseFloat(formData.stopLoss), tp = parseFloat(formData.takeProfit);
    if (!e || !sl || !tp || isNaN(e) || isNaN(sl) || isNaN(tp)) return null;
    const risk = Math.abs(e - sl); return risk === 0 ? null : (Math.abs(tp - e) / risk).toFixed(2);
  })();


  const riskAmount = (() => {
    const b = parseFloat(formData.accountBalance), r = parseFloat(formData.riskPercent);
    return (!isNaN(b) && !isNaN(r)) ? (b * r / 100).toFixed(2) : null;
  })();

  const warnings = [
    formData.riskPercent && parseFloat(formData.riskPercent) > 3 && 'Risk 3%-аас их байна!',
    !formData.stopLoss && formData.entry && 'Stop Loss тавиагүй байна!',
    rr && parseFloat(rr) < 1 && 'R/R харьцаа 1-ээс бага байна!',
  ].filter(Boolean);

  // ── Tag lists: DB-only when available, static fallback ───────────────────────
  // Static IDs ('calm', 'confident'…) and DB UUIDs never match, so merging
  // always causes duplicates. Use DB exclusively when it returns data.
  const allEmotions     = customEmotions.length     > 0 ? customEmotions     : EMOTIONS;
  const allPositiveTags = customPositiveTags.length > 0 ? customPositiveTags : POSITIVE_TAGS;
  const allMistakeTags  = customMistakeTags.length  > 0 ? customMistakeTags  : MISTAKE_TAGS;

  const inputCls  = "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all text-sm font-mono";
  const labelCls  = "block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 w-full max-w-[540px] bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">{initialData ? 'Арилжаа засах' : 'Шинэ арилжаа нэмэх'}</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Хэсэг бүрийг нээж бөглөнө үү</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">

          {/* ══ SECTION 1: Зах зээл & Чиглэл ══ */}
          <Section icon={Target} title="Зах зээл & Чиглэл" sectionKey="market" openSections={openSections} onToggle={toggleSection}>

            {/* Market type */}
            <div className="mb-4">
              <label className={labelCls}>Зах зээлийн төрөл</label>
              <div className="flex flex-wrap gap-1.5">
                {MARKET_TYPES.map(m => (
                  <button key={m.id} type="button" onClick={() => setV('market', m.id)}
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
                <input type="datetime-local" className={inputCls} value={formData.date || ''} onChange={set('date')} />
              </div>
              <div>
                <label className={labelCls}>Symbol / Asset</label>
                <input type="text" placeholder="EURUSD, BTC, AAPL" className={`${inputCls} uppercase`}
                  value={formData.symbol} onChange={e => setV('symbol', e.target.value.toUpperCase())} />
              </div>
            </div>

            {/* Strategy */}
            <div className="mb-3">
              <label className={labelCls}>Стратеги</label>
              <input type="text" placeholder="ICT, SMC, Supply & Demand, Scalping…" className={inputCls}
                value={formData.strategy} onChange={set('strategy')} />
            </div>

            {/* Direction */}
            <div className="mb-3">
              <label className={labelCls}>Чиглэл</label>
              <div className="flex gap-2">
                {[['LONG','LONG ↑','emerald'],['SHORT','SHORT ↓','rose']].map(([val, lbl, col]) => (
                  <button key={val} type="button" onClick={() => setV('direction', val)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      formData.direction === val
                        ? `bg-${col}-500/10 border-${col}-500/50 text-${col}-400`
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}>{lbl}</button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="mb-3">
              <label className={labelCls}>Төлөв</label>
              <div className="flex gap-2">
                {['PLANNED','OPEN','CLOSED'].map(s => (
                  <button key={s} type="button" onClick={() => setV('status', s)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                      formData.status === s ? 'bg-slate-800 border-slate-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}>{s}</button>
                ))}
              </div>
            </div>

            {/* Market-specific fields */}
            {(formData.market === 'forex' || formData.market === 'indices' || formData.market === 'gold') && (
              <div>
                <label className={labelCls}>Trading Session</label>
                <div className="flex flex-wrap gap-2">
                  {SESSIONS.map(s => (
                    <button key={s.id} type="button" onClick={() => setV('session', s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        formData.session?.toLowerCase() === s.id?.toLowerCase() ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                      }`}>{s.label}</button>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* ══ SECTION 2: Гүйцэтгэл & Эрсдэл ══ */}
          <Section icon={LineChart} title="Гүйцэтгэл & Эрсдэл" sectionKey="execution" openSections={openSections} onToggle={toggleSection}>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelCls}>Entry Price</label>
                <input type="number" step="any" className={inputCls} value={formData.entry} onChange={set('entry')} />
              </div>
              <div>
                <label className={labelCls}>Exit Price <span className="text-slate-600 normal-case font-normal">(opt)</span></label>
                <input type="number" step="any" className={inputCls} value={formData.exit} onChange={set('exit')} />
              </div>
              <div>
                <label className={labelCls}>P&L <span className="text-slate-600 normal-case font-normal">(broker-оос)</span></label>
                <input type="number" step="any" placeholder="0.00" className={inputCls} value={formData.pnl} onChange={set('pnl')} />
              </div>
              <div>
                <label className={labelCls}>Stop Loss</label>
                <input type="number" step="any" className={`${inputCls} text-rose-400`} value={formData.stopLoss} onChange={set('stopLoss')} />
              </div>
              <div>
                <label className={labelCls}>Take Profit</label>
                <input type="number" step="any" className={`${inputCls} text-emerald-400`} value={formData.takeProfit} onChange={set('takeProfit')} />
              </div>
              <div>
                <label className={labelCls}>Quantity / Lot</label>
                <input type="number" step="any" placeholder="0.5" className={inputCls} value={formData.quantity} onChange={set('quantity')} />
              </div>
              <div>
                <label className={labelCls}>Risk %</label>
                <div className="relative">
                  <input type="number" step="any" placeholder="1.0" className={`${inputCls} pr-8`} value={formData.riskPercent} onChange={set('riskPercent')} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className={labelCls}>Account Balance</label>
              <input type="number" step="any" className={inputCls} value={formData.accountBalance ? parseFloat(formData.accountBalance).toFixed(2) : ''}
                onChange={e => { setV('accountBalance', e.target.value); localStorage.setItem('account_balance', e.target.value); }} />
            </div>

            {/* Calculations */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'R/R Харьцаа', value: rr ? `${rr}R` : '—', cls: 'text-white' },
                  { label: 'P&L', value: formData.pnl !== '' && formData.pnl != null ? `${parseFloat(formData.pnl) > 0 ? '+' : ''}$${formData.pnl}` : '—', cls: parseFloat(formData.pnl) > 0 ? 'text-emerald-400' : parseFloat(formData.pnl) < 0 ? 'text-rose-400' : 'text-white' },
                  { label: 'Risk $',      value: riskAmount ? `$${riskAmount}` : '—', cls: 'text-rose-400' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{item.label}</div>
                    <div className={`text-lg font-mono font-bold ${item.cls}`}>{item.value}</div>
                  </div>
                ))}
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
          </Section>

          {/* ══ SECTION 3: Сэтгэл зүй & Үнэлгээ ══ */}
          <Section icon={Brain} title="Сэтгэл зүй & Үнэлгэ" sectionKey="psychology" openSections={openSections} onToggle={toggleSection}>

            {/* Emotion before */}
            <div className="mb-4">
              <label className={labelCls}>Орох үеийн сэтгэл зүй</label>
              <div className="flex flex-wrap gap-1.5">
                {allEmotions.map(e => (
                  <TagChip
                    key={`before-${e.id}`}
                    tag={e}
                    isSelected={formData.emotionBefore === e.id}
                    onClick={() => setV('emotionBefore', formData.emotionBefore === e.id ? '' : e.id)}
                    onDelete={e.isDefault === false ? () => handleDeleteEmotion(e.id) : null}
                    colorSelected="bg-slate-800 border-slate-500 text-white"
                  />
                ))}
                <button type="button" onClick={() => setCustomTagModal({ type: 'emotion' })}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-950 text-slate-500 border border-dashed border-slate-700 hover:border-slate-500 hover:text-slate-300 transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Нэмэх
                </button>
              </div>
            </div>

            {/* Emotion after */}
            <div className="mb-4">
              <label className={labelCls}>Гарах үеийн сэтгэл зүй</label>
              <div className="flex flex-wrap gap-1.5">
                {allEmotions.map(e => (
                  <TagChip
                    key={`after-${e.id}`}
                    tag={e}
                    isSelected={formData.emotionAfter === e.id}
                    onClick={() => setV('emotionAfter', formData.emotionAfter === e.id ? '' : e.id)}
                    onDelete={e.isDefault === false ? () => handleDeleteEmotion(e.id) : null}
                    colorSelected="bg-slate-800 border-slate-500 text-white"
                  />
                ))}
                <button type="button" onClick={() => setCustomTagModal({ type: 'emotion' })}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-950 text-slate-500 border border-dashed border-slate-700 hover:border-slate-500 hover:text-slate-300 transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Нэмэх
                </button>
              </div>
            </div>

            {/* Positive tags */}
            <div className="mb-4">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">
                <Check className="w-3 h-3" /> Давуу тал (Positive Tags)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {allPositiveTags.map(t => (
                  <TagChip
                    key={t.id}
                    tag={t}
                    isSelected={formData.positiveTags.includes(t.id)}
                    onClick={() => toggleTag('positiveTags', t.id)}
                    onDelete={t.isDefault === false ? () => handleDeleteTag('positive', t.id) : null}
                    colorSelected="bg-accent/10 border-accent/50 text-accent"
                  />
                ))}
                <button type="button" onClick={() => setCustomTagModal({ type: 'positive' })}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-950 text-slate-500 border border-dashed border-slate-700 hover:border-slate-500 hover:text-slate-300 transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Нэмэх
                </button>
              </div>
            </div>

            {/* Mistake tags */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 uppercase tracking-wide mb-2">
                <X className="w-3 h-3" /> Алдаа (Mistake Tags)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {allMistakeTags.map(t => (
                  <TagChip
                    key={t.id}
                    tag={t}
                    isSelected={formData.mistakeTags.includes(t.id)}
                    onClick={() => toggleTag('mistakeTags', t.id)}
                    onDelete={t.isDefault === false ? () => handleDeleteTag('mistake', t.id) : null}
                    colorSelected="bg-rose-500/10 border-rose-500/50 text-rose-400"
                  />
                ))}
                <button type="button" onClick={() => setCustomTagModal({ type: 'mistake' })}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-950 text-slate-500 border border-dashed border-slate-700 hover:border-slate-500 hover:text-slate-300 transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Нэмэх
                </button>
              </div>
            </div>
          </Section>

          {/* ══ SECTION 4: Тэмдэглэл & Зураг ══ */}
          <Section icon={LayoutTemplate} title="Тэмдэглэл & Зураг" sectionKey="journal" openSections={openSections} onToggle={toggleSection}>
            <div className="space-y-4">
              {[
                { field: 'whyEntered',    label: 'Яагаад орсон бэ?',  placeholder: 'Setup, дохио, шалтгаан…' },
                { field: 'whatHappened',  label: 'Юу болсон бэ?',     placeholder: 'Зах зээл хэрхэн хөдөлсөн, TP/SL-д хүрсэн эсэх…' },
                { field: 'lessonLearned', label: 'Юу сурсан бэ?',     placeholder: 'Сургамж, дараа анхаарах зүйл…' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className={labelCls}>{label}</label>
                  <textarea rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 resize-none transition-all"
                    placeholder={placeholder}
                    value={formData[field]} onChange={set(field)} />
                </div>
              ))}

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
                          if (file) { const r = new FileReader(); r.onloadend = () => setV('screenshot_url', r.result); r.readAsDataURL(file); }
                        }} />
                      </label>
                      <button type="button" onClick={() => setV('screenshot_url', null)}
                        className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-medium rounded-lg">Устгах</button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-700 hover:border-accent/50 bg-slate-950/50 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group">
                    <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-accent mb-2 transition-colors" />
                    <p className="text-sm text-slate-400">Зураг оруулах эсвэл Drag & Drop</p>
                    <p className="text-xs text-slate-600 mt-1">PNG, JPG, GIF (Max 5MB)</p>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) { const r = new FileReader(); r.onloadend = () => setV('screenshot_url', r.result); r.readAsDataURL(file); }
                    }} />
                  </label>
                )}
              </div>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 shrink-0 space-y-2">
          {saveError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{saveError}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => handleSave(true)} disabled={isSaving}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 border border-slate-700">
              <Save className="w-4 h-4" />{isSaving ? '…' : 'Ноорог'}
            </button>
            <button type="button" onClick={() => handleSave(false)} disabled={isSaving}
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
