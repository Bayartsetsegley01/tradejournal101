import { Link } from "react-router-dom";
import { BarChart2 } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
          <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-slate-950" />
          </div>
          TradeJournal
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Онцлог</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">Хэрхэн ажилладаг</a>
          <a href="#pricing" className="hover:text-white transition-colors">Үнэ</a>
          <a href="#faq" className="hover:text-white transition-colors">Асуулт</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/app" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">
            Нэвтрэх
          </Link>
          <Link to="/app" className="bg-accent hover:bg-accent-hover text-slate-950 text-sm font-semibold py-2 px-4 rounded-lg transition-colors">
            Үнэгүй эхлэх
          </Link>
        </div>
      </div>
    </header>
  );
}
