import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24 bg-slate-950 relative border-t border-slate-900 overflow-hidden">
      <div className="absolute inset-0 bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
          Арилжааны сахилга батаа <br className="hidden md:block" />
          <span className="text-accent">өнөөдрөөс эхлэн</span> сайжруул
        </h2>
        <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
          Бүх төрлийн арилжаанд тэмдэглэл хөтөлж, алдаанаасаа суралцаж эхлээрэй
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/app" className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-slate-950 text-base font-semibold py-3 px-8 rounded-xl transition-colors flex items-center justify-center gap-2">
            Үнэгүй эхлэх
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/login" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white text-base font-medium py-3 px-8 rounded-xl transition-colors flex items-center justify-center">
            Нэвтрэх
          </Link>
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Карт шаардлагагүй. Хэзээ ч цуцлах боломжтой.
        </p>
      </div>
    </section>
  );
}
