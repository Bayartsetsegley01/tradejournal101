export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Арилжаагаа бүртгэ",
      description: "Өдрийн төгсгөлд эсвэл арилжаа хаагдсаны дараа хос валют, орсон гарсан үнэ, лот хэмжээгээ оруулна.",
      benefit: "Бүх дата нэг дор цэгцтэй хадгалагдана."
    },
    {
      number: "02",
      title: "Тэмдэглэл, алдаа, сэтгэлзүйгээ тэмдэглэ",
      description: "Арилжааны өмнөх болон дараах сэтгэл хөдлөл, гаргасан алдаа, дүрмээ баримталсан эсэхээ бичнэ.",
      benefit: "Өөрийнхөө сэтгэл зүйн сул талыг олж харна."
    },
    {
      number: "03",
      title: "AI-аас дүн шинжилгээ ав",
      description: "Долоо хоног бүр AI таны датанд анализ хийж, ямар session-д, ямар алдаа их гаргаж байгааг хэлж өгнө.",
      benefit: "Дараагийн долоо хоногт юун дээр анхаарах төлөвлөгөөтэй болно."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Хэрхэн ажилладаг вэ?
          </h2>
          <p className="text-slate-400 text-lg">
            Өдөрт ердөө 5 минутыг тэмдэглэл хөтлөхөд зарцуулснаар таны арилжааны үр дүн эрс өөрчлөгдөнө.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-gradient-to-r from-slate-800 via-accent/50 to-slate-800" />

          {steps.map((step, index) => (
            <div key={index} className="relative flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-slate-950 border-2 border-slate-800 rounded-full flex items-center justify-center mb-6 relative z-10 shadow-[0_0_30px_rgba(200,240,122,0.05)]">
                <span className="text-2xl font-bold text-accent">{step.number}</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                {step.description}
              </p>
              <div className="mt-auto bg-accent/10 border border-accent/20 text-accent text-xs font-medium py-2 px-4 rounded-lg">
                Үр дүн: {step.benefit}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
