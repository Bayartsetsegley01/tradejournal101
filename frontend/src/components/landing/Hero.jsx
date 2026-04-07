import { Link } from "react-router-dom";
import { ArrowRight, Activity, Target, ShieldCheck } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium tracking-wide uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Монгол арилжаачдад зориулсан
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
            Арилжааны тэмдэглэл хөтлөж, <span className="text-accent">алдаанаасаа суралц</span>
          </h1>
          
          <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
            Хийсэн арилжааг бүртгэж, AI-ийн тусламжтайгаар алдаагаа засч, тогтвортой ашигтай арилжаачин болоорой.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/app" className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-slate-950 text-base font-semibold py-3 px-8 rounded-xl transition-colors flex items-center justify-center gap-2">
              Үнэгүй эхлэх
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white text-base font-medium py-3 px-8 rounded-xl transition-colors flex items-center justify-center">
              Хэрхэн ажилладаг вэ?
            </a>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent/70" />
              <span>Брокер холбох шаардлагагүй</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-accent/70" />
              <span>Сахилга батад төвлөрсөн</span>
            </div>
          </div>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="mt-20 relative mx-auto max-w-5xl">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-20" />
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-2 backdrop-blur-sm shadow-2xl relative z-10 overflow-hidden">
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden aspect-video relative flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop" 
                alt="Trading Dashboard" 
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
              
              {/* Abstract UI Elements representing the dashboard */}
              <div className="relative z-10 w-full h-full p-8 flex flex-col gap-6">
                <div className="flex gap-4">
                  <div className="h-24 flex-1 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/50 p-4 flex flex-col justify-between shadow-lg">
                    <div className="w-20 h-3 bg-slate-700 rounded-full" />
                    <div className="w-32 h-8 bg-accent/20 rounded-md border border-accent/30" />
                  </div>
                  <div className="h-24 flex-1 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/50 p-4 flex flex-col justify-between shadow-lg">
                    <div className="w-24 h-3 bg-slate-700 rounded-full" />
                    <div className="w-28 h-8 bg-emerald-500/20 rounded-md border border-emerald-500/30" />
                  </div>
                  <div className="h-24 flex-1 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/50 p-4 flex flex-col justify-between shadow-lg">
                    <div className="w-16 h-3 bg-slate-700 rounded-full" />
                    <div className="w-36 h-8 bg-rose-500/20 rounded-md border border-rose-500/30" />
                  </div>
                </div>
                <div className="flex-1 flex gap-4">
                  <div className="flex-[2] bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-screen" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-transparent" />
                    <div className="relative z-10 w-full h-full border-b border-l border-slate-700">
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d="M0,100 L20,80 L40,85 L60,40 L80,50 L100,20" fill="none" stroke="#c8f07a" strokeWidth="2" className="drop-shadow-[0_0_8px_rgba(200,240,122,0.8)]" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 flex flex-col gap-4 shadow-lg">
                    <div className="w-24 h-4 bg-slate-700 rounded-full mb-2" />
                    <div className="w-full h-12 bg-accent/10 rounded-lg border border-accent/20 flex items-center px-4"><div className="w-1/2 h-2 bg-accent/50 rounded-full" /></div>
                    <div className="w-full h-12 bg-rose-500/10 rounded-lg border border-rose-500/20 flex items-center px-4"><div className="w-3/4 h-2 bg-rose-500/50 rounded-full" /></div>
                    <div className="w-full h-12 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center px-4"><div className="w-1/3 h-2 bg-slate-600 rounded-full" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
