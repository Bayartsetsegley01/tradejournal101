import { CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";

export function AnalyticsPreview() {
  return (
    <section className="py-24 bg-slate-900/30 relative border-t border-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Text Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-6">
              Тоо баримт таны<br />
              <span className="text-accent">давуу тал</span> болно
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Зөвхөн P&L хараад өнгөрөх биш, өөрийнхөө арилжааны хэв маягийг бүрэн ойлго. Хэзээ арилжаанд орох, хэзээ өнжихөө тоон мэдээлэлд үндэслэн шийдвэрлэ.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">Session Performance</h4>
                  <p className="text-sm text-slate-400">London session дээр илүү ашигтай байна уу, эсвэл New York дээр үү гэдгээ тодорхойл.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0 mt-1">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">Mistake Patterns</h4>
                  <p className="text-sm text-slate-400">Хамгийн их давтагдаж буй алдаанууд (жишээ нь: эрт хаах, stop loss хөдөлгөх) болон тэдгээрийн өртгийг хар.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">Discipline Trends</h4>
                  <p className="text-sm text-slate-400">Төлөвлөгөөгөө хэр сайн дагаж байгаагаа график дээрээс харж, сахилга батаа үнэл.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mockup */}
          <div className="relative">
            <div className="absolute inset-0 bg-accent/5 blur-[100px] rounded-full" />
            <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-white font-medium">Долоо хоногийн тайлан</h3>
                <span className="text-xs font-medium px-2 py-1 bg-slate-800 text-slate-300 rounded-md">Oct 12 - Oct 16</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-slate-500 text-xs mb-1">Win Rate</div>
                  <div className="text-2xl font-bold text-white">68%</div>
                  <div className="text-accent text-xs mt-1">↑ 12% vs last week</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-slate-500 text-xs mb-1">Profit Factor</div>
                  <div className="text-2xl font-bold text-white">2.4</div>
                  <div className="text-accent text-xs mt-1">↑ 0.3 vs last week</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm font-medium text-slate-300">Хамгийн их гарсан алдаанууд</div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Эрт ашгаа авах (FOMO)</span>
                      <span className="text-rose-400">-$340</span>
                    </div>
                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 w-[60%]" />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Төлөвлөгөөгүй арилжаа</span>
                      <span className="text-rose-400">-$120</span>
                    </div>
                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 w-[25%]" />
                    </div>
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
