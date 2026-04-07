export function FAQ() {
  const faqs = [
    {
      q: "Энэ систем бодит арилжаа хийдэг үү?",
      a: "Үгүй. TradeLog нь зөвхөн таны хийсэн арилжааг бүртгэж, анализ хийх зориулалттай тэмдэглэлийн (journal) систем юм."
    },
    {
      q: "Брокертой холбогдох уу?",
      a: "Одоогоор үгүй. Та арилжаагаа гараар бүртгэх бөгөөд энэ нь таныг арилжаа бүртээ илүү хариуцлагатай хандаж, алдаагаа тунгаан бодоход тусална."
    },
    {
      q: "AI яаж дүн шинжилгээ хийдэг вэ?",
      a: "Таны оруулсан арилжааны дата, сэтгэл зүйн тэмдэглэл болон алдааны бүртгэл дээр үндэслэн AI таны сул талыг илрүүлж, дараагийн арилжаанд зориулсан зөвлөмж гаргадаг."
    },
    {
      q: "Миний мэдээлэл аюулгүй юу?",
      a: "Тийм. Таны дата найдвартай хамгаалагдсан бөгөөд зөвхөн танд л харагдана. Бид таны мэдээллийг 3-дагч этгээдэд худалдахгүй."
    },
    {
      q: "Үнэгүй хувилбар дээр юу ордог вэ?",
      a: "Үнэгүй хувилбараар та сард 30 хүртэлх арилжаа бүртгэж, үндсэн хянах самбар болон энгийн тэмдэглэл хөтлөх боломжтой."
    }
  ];

  return (
    <section id="faq" className="py-24 bg-slate-950 border-t border-slate-900">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Түгээмэл асуултууд
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-2">{faq.q}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
