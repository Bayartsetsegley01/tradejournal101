import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Үнийн мэдээлэл
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Арилжааны сахилга батаа сайжруулахад тань туслах багцууд.
          </p>
          
          {/* Toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-white' : 'text-slate-500'}`}>Сар бүр</span>
            <button 
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-14 h-7 bg-slate-800 rounded-full p-1 transition-colors hover:bg-slate-700 focus:outline-none"
            >
              <div className={`w-5 h-5 bg-accent rounded-full shadow-md transition-transform duration-300 ${isYearly ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-medium transition-colors flex items-center gap-2 ${isYearly ? 'text-white' : 'text-slate-500'}`}>
              Жилээр
              <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Хямдралтай</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col hover:border-slate-700 transition-colors">
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-2">FREE PLAN</h3>
              <p className="text-slate-400 text-sm">Тэмдэглэл хөтөлж эхлэх гэж буй хүмүүст</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-bold text-white">Үнэгүй</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="w-5 h-5 text-slate-500 shrink-0" />
                Сард 30 арилжаа бүртгэх
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="w-5 h-5 text-slate-500 shrink-0" />
                Үндсэн dashboard
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="w-5 h-5 text-slate-500 shrink-0" />
                Арилжааны тэмдэглэл
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="w-5 h-5 text-slate-500 shrink-0" />
                Сэтгэл зүйн анализ
              </li>
            </ul>
            <Link to="/app" className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors text-center">
              Эхлэх
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-accent/30 rounded-3xl p-8 flex flex-col relative shadow-[0_0_40px_rgba(200,240,122,0.05)] hover:border-accent/50 transition-colors">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-slate-950 text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
              Санал болгох
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-2">PRO PLAN</h3>
              <p className="text-slate-400 text-sm">Тогтвортой ашигтай болох зорилготой арилжаачдад</p>
            </div>
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">${isYearly ? '16' : '20'}</span>
              <span className="text-slate-500 text-sm">/ сард {isYearly && '(Жилээр төлнө)'}</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="w-5 h-5 text-accent shrink-0" />
                Unlimited trades
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="w-5 h-5 text-accent shrink-0" />
                AI analysis
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="w-5 h-5 text-accent shrink-0" />
                Full analytics
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="w-5 h-5 text-accent shrink-0" />
                Export (PDF/CSV)
              </li>
            </ul>
            <button 
              onClick={() => alert("Төлбөрийн систем холбогдоход бэлэн болсон байна. (Stripe/QPay integration pending)")}
              className="w-full bg-accent hover:bg-accent-hover text-slate-950 text-sm font-semibold py-3 px-4 rounded-xl transition-colors text-center shadow-[0_0_15px_rgba(200,240,122,0.2)] hover:shadow-[0_0_25px_rgba(200,240,122,0.4)]"
            >
              Одоо захиалах
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
