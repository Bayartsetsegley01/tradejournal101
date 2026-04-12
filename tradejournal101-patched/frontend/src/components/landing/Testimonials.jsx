export function Testimonials() {
  const testimonials = [
    {
      quote: "London session дээр дандаа алдагдал хүлээдгээ энэ системээс л олж харсан. Одоо зөвхөн NY session-д төвлөрч, win rate маань 15%-иар өссөн.",
      author: "Бат-Эрдэнэ",
      role: "SMC Trader"
    },
    {
      quote: "Overtrading хийхээ больсон. Арилжаа бүрийн өмнө сэтгэл зүйгээ тэмдэглэдэг болсноор FOMO-д автах нь эрс багассан.",
      author: "Тэмүүлэн",
      role: "Day Trader"
    },
    {
      quote: "AI-ийн долоо хоногийн тайлан үнэхээр гайхалтай. Миний гаргаж буй алдаануудыг яг л ментор шиг хэлж өгдөг.",
      author: "Номин",
      role: "Swing Trader"
    }
  ];

  return (
    <section className="py-24 bg-slate-900/30 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Арилжаачдын сэтгэгдэл
          </h2>
          <p className="text-slate-400 text-lg">
            Сахилга батаа сайжруулж, тогтвортой үр дүнд хүрсэн арилжаачдын бодит туршлага.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col">
              <div className="flex-1">
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  "{testimonial.quote}"
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-medium text-sm">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{testimonial.author}</div>
                  <div className="text-accent text-xs">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
