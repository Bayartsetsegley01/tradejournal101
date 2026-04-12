import { BarChart2, Twitter, Facebook, Instagram, Github } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-tight mb-4 group">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(200,240,122,0.2)] group-hover:shadow-[0_0_20px_rgba(200,240,122,0.4)] transition-all">
                <BarChart2 className="w-5 h-5 text-slate-950" />
              </div>
              TradeJournal
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed">
              Арилжааны тэмдэглэл хөтлөж, алдаанаасаа суралцаж, тогтвортой ашигтай арилжаачин болох зам.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Цэс</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-accent transition-colors">Нүүр хуудас</a></li>
              <li><a href="#features" className="hover:text-accent transition-colors">Боломжууд</a></li>
              <li><a href="#pricing" className="hover:text-accent transition-colors">Үнийн мэдээлэл</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Холбоо барих</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Хууль эрх зүй</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-accent transition-colors">Нууцлалын бодлого (Privacy Policy)</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Үйлчилгээний нөхцөл (Terms of Service)</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Сошиал</h4>
            <div className="flex items-center gap-4 text-slate-500">
              <a href="#" className="hover:text-accent transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-accent transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-accent transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="hover:text-accent transition-colors"><Github className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-600">
          <div>© {new Date().getFullYear()} TradeJournal. Бүх эрх хуулиар хамгаалагдсан.</div>
          <div className="flex items-center gap-2">
            Made with <span className="text-rose-500">♥</span> for Traders
          </div>
        </div>
      </div>
    </footer>
  );
}
