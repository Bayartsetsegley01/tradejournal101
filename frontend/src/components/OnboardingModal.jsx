import { useState } from "react";
import { BookOpen, BarChart2, Sparkles, CalendarDays, CheckCircle2, X } from "lucide-react";

const STEPS = [
  {
    icon: CheckCircle2,
    color: "text-accent",
    title: "TradeJournal-д тавтай морил! 🎉",
    desc: "Арилжааны тэмдэглэлээ хөтлөх, дүн шинжилгээ хийх, өөрийгөө хөгжүүлэх гайхалтай хэрэгсэл.",
  },
  {
    icon: BookOpen,
    color: "text-blue-400",
    title: "Trade-ээ бүртгэнэ үү",
    desc: "\"Шинэ Trade\" товч дарж оролт, гарлт, P&L, сэтгэл хөдлөлөө тэмдэглэнэ үү. Тогтмол бүртгэл — амжилтын үндэс.",
  },
  {
    icon: BarChart2,
    color: "text-emerald-400",
    title: "Analytics & Insights",
    desc: "Win rate, profit factor, equity curve болон бусад дүн шинжилгээг автоматаар харна. Алдаанаасаа суралцаарай.",
  },
  {
    icon: Sparkles,
    color: "text-purple-400",
    title: "AI Зөвлөгч",
    desc: "Таны trade-ийн мэдээллийг үндэслэн AI хувийн зөвлөгөө өгнө. Стратегиа сайжруулаарай.",
  },
  {
    icon: CalendarDays,
    color: "text-amber-400",
    title: "Долоо хоногийн дүгнэлт",
    desc: "Долоо бүр гүйцэтгэлээ дүгнэж, дараагийн долоо хоногт илүү сайн арилжаа хийнэ үү.",
  },
];

export function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const { icon: Icon, color, title, desc } = STEPS[step];

  const finish = () => {
    localStorage.setItem('onboarding_done', '1');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
        <button onClick={finish} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-5 ${color}`}>
            <Icon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
          <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <button key={i} onClick={() => setStep(i)}
              className={`rounded-full transition-all ${i === step ? 'w-6 h-2 bg-accent' : 'w-2 h-2 bg-slate-700 hover:bg-slate-600'}`} />
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={finish}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            Алгасах
          </button>
          <button onClick={() => isLast ? finish() : setStep(s => s + 1)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-accent hover:bg-accent-hover text-slate-950 transition-all">
            {isLast ? 'Эхлэх' : 'Дараах →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useOnboarding() {
  const done = localStorage.getItem('onboarding_done') === '1';
  return !done;
}
