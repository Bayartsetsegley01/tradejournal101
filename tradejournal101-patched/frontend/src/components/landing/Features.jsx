import { BookOpen, Sparkles, Brain, LineChart, Target, ShieldCheck } from "lucide-react";

const features = [
  {
    title: "Арилжааны тэмдэглэл",
    description: "Entry/Exit үнэ, quantity, trade type — бүх мэдээллийг гараар бүртгэж, сэтгэлзүйн тэмдэглэл нэм.",
    icon: BookOpen
  },
  {
    title: "AI Chat анализ",
    description: "\"Яагаад алдаад байна?\" гэж асуухад AI таны өгөгдөлд тулгуурлан хариулна.",
    icon: Sparkles
  },
  {
    title: "Зан төлөвийн анализ",
    description: "Fear, FOMO, Confidence гэсэн сэтгэлзүйн өгөгдлийг бүртгэж, давтагдах pattern-ийг олж мэд.",
    icon: Brain
  },
  {
    title: "Performance метрик",
    description: "Win rate, ашиг/алдагдал, риск/reward ratio — бүх тооцоо автоматаар гарна.",
    icon: LineChart
  },
  {
    title: "Стратегийн тэмдэглэл",
    description: "Ямар стратеги ашигласан, яагаад арилжааг хийсэн — дараа нь харьцуулж судалж болно.",
    icon: Target
  },
  {
    title: "Хувийн мэдээлэл аюулгүй",
    description: "Брокерт холбогддоггүй, бодит арилжаа хийдэггүй. Зөвхөн таны тэмдэглэлийн орон зай.",
    icon: ShieldCheck
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Яагаад TradeJournal гэж?
          </h2>
          <p className="text-slate-400 text-lg">
            Crypto, Forex, Stock — аль ч зах зээлд хийсэн арилжааг бүртгэж, AI-тай хамт дүн шинжилгээ хий.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:bg-slate-800/80 hover:-translate-y-1 transition-all duration-300 group shadow-lg hover:shadow-xl hover:shadow-accent/5">
              <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center mb-6 group-hover:border-accent/50 group-hover:bg-accent/10 transition-colors">
                <feature.icon className="w-6 h-6 text-slate-400 group-hover:text-accent transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
