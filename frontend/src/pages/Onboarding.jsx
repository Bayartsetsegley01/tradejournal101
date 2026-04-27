import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart2, ArrowRight, ArrowLeft, SkipForward, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const STEPS = [
  {
    id: "experience",
    question: "Та хэдэн жил арилжаа хийж байна вэ?",
    subtitle: "Танд тохирох туршлагын түвшинг тодорхойлоход туслана",
    options: [
      { value: "0-3m", label: "0–3 сар", icon: "🌱", desc: "Шинхэн" },
      { value: "3-12m", label: "3–12 сар", icon: "📈", desc: "Суурь мэдлэгтэй" },
      { value: "1-3y", label: "1–3 жил", icon: "🎯", desc: "Туршлагатай" },
      { value: "3y+", label: "3+ жил", icon: "🏆", desc: "Мэргэжлийн" },
    ],
  },
  {
    id: "markets",
    question: "Та ямар зах зээл дээр арилжаа хийдэг вэ?",
    subtitle: "Нэг буюу хэд хэдэн зах зээл сонгоно уу",
    multi: true,
    options: [
      { value: "FOREX", label: "Forex", icon: "💱", desc: "Валютын зах зээл" },
      { value: "GOLD", label: "Алт", icon: "🥇", desc: "Металл, XAU/USD" },
      { value: "CRYPTO", label: "Crypto", icon: "₿", desc: "Цифрийн валют" },
      { value: "STOCKS", label: "Stocks", icon: "🏢", desc: "Компанийн хувьцаа" },
      { value: "INDICES", label: "Indices", icon: "📊", desc: "Зах зээлийн индекс" },
    ],
  },
  {
    id: "timeframe",
    question: "Та ямар timeframe ашигладаг вэ?",
    subtitle: "Арилжааны хугацааны хүрээгээ сонгоно уу",
    options: [
      { value: "scalping", label: "M1–M5 Скалпинг", icon: "⚡", desc: "Маш богино хугацаа" },
      { value: "intraday", label: "M15–H1 Өдрийн", icon: "☀️", desc: "Өдрийн дотор" },
      { value: "swing", label: "H4–D1 Свинг", icon: "🌊", desc: "Хэдэн хоног" },
      { value: "mixed", label: "Холимог", icon: "🎭", desc: "Олон timeframe" },
    ],
  },
  {
    id: "level",
    question: "Өөрийгөө ямар түвшний трейдер гэж үздэг вэ?",
    subtitle: "Хамгийн тохирох түвшинг сонгоно уу",
    options: [
      { value: "beginner", label: "Анхан шат", icon: "🌟", desc: "Үндсийг судалж байна" },
      { value: "intermediate", label: "Дунд шат", icon: "💪", desc: "Стратегитай, тогтвортой" },
      { value: "advanced", label: "Гүнзгий", icon: "🧠", desc: "Системтэй, сахилгатай" },
    ],
  },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];
  const total = STEPS.length;
  const progress = ((step + 1) / total) * 100;

  const selected = answers[current.id];
  const isSelected = (val) => current.multi ? (selected || []).includes(val) : selected === val;

  const toggleOption = (val) => {
    if (current.multi) {
      const prev = answers[current.id] || [];
      const next = prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val];
      setAnswers(a => ({ ...a, [current.id]: next }));
    } else {
      setAnswers(a => ({ ...a, [current.id]: val }));
    }
  };

  const canNext = current.multi ? (selected?.length > 0) : !!selected;

  const finish = async (skip = false) => {
    setSaving(true);
    try {
      const profile = skip ? {} : answers;
      const token = localStorage.getItem('token');
      await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify({ trader_profile: profile }),
      });
      await refreshUser();
      navigate('/app', { replace: true });
    } catch {
      navigate('/app', { replace: true });
    } finally { setSaving(false); }
  };

  const handleNext = () => {
    if (step < total - 1) setStep(s => s + 1);
    else finish();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-accent/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-blue-500/8 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-slate-950" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">TradeJournal</span>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Алхам {step + 1} / {total}</span>
              <span className="text-xs text-slate-500">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex gap-2 mt-3">
              {STEPS.map((_, i) => (
                <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < step ? 'bg-accent' : i === step ? 'bg-accent/60' : 'bg-slate-800'}`} />
              ))}
            </div>
          </div>

          {/* Question */}
          <div className="mb-7">
            <h2 className="text-xl font-bold text-white mb-2">{current.question}</h2>
            <p className="text-slate-400 text-sm">{current.subtitle}</p>
          </div>

          {/* Options */}
          <div className={`grid gap-3 mb-8 ${current.options.length <= 4 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {current.options.map(opt => {
              const active = isSelected(opt.value);
              return (
                <button key={opt.value} onClick={() => toggleOption(opt.value)}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 group ${
                    active
                      ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(200,240,122,0.15)]'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/70'
                  }`}>
                  {active && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-slate-950" />
                    </div>
                  )}
                  <span className="text-2xl mb-2 block">{opt.icon}</span>
                  <p className={`text-sm font-semibold mb-0.5 ${active ? 'text-accent' : 'text-white'}`}>{opt.label}</p>
                  <p className="text-xs text-slate-500 leading-snug">{opt.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                  <ArrowLeft className="w-4 h-4" /> Буцах
                </button>
              )}
              <button onClick={() => finish(true)} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all">
                <SkipForward className="w-4 h-4" /> Алгасах
              </button>
            </div>

            <button onClick={handleNext} disabled={!canNext || saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-40 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(200,240,122,0.2)] hover:shadow-[0_0_25px_rgba(200,240,122,0.35)]">
              {saving ? 'Хадгалж байна...' : step === total - 1 ? <><Check className="w-4 h-4" /> Дуусгах</> : <>Дараах <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
