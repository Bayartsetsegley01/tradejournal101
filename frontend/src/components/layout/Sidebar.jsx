import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen, BarChart2, Sparkles, Settings, PlusCircle,
  User, CreditCard, LogOut, BrainCircuit, CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { AddTradeModal } from "@/components/features/journal/AddTradeModal";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLang();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const primaryMenu = [
    { key: "analytics", icon: BarChart2, path: "/app/analytics" },
    { key: "journal", icon: BookOpen, path: "/app/journal" },
    { key: "mistakes", icon: BrainCircuit, path: "/app/mistakes" },
    { key: "aiAdvisor", icon: Sparkles, path: "/app/ai-advisor" },
    { key: "weeklyReview", icon: CalendarDays, path: "/app/weekly-review" },
    { key: "settings", icon: Settings, path: "/app/settings" },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-slate-800 fixed top-0 left-0 h-screen shrink-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <Link to="/app/analytics" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-slate-950 font-black text-sm">TJ</span>
            </div>
            <span className="font-bold text-white text-base tracking-tight">TradeJournal</span>
          </Link>
        </div>

        {/* Add Trade Button */}
        <div className="p-4">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-slate-950 font-bold text-sm py-2.5 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(200,240,122,0.15)] hover:shadow-[0_0_20px_rgba(200,240,122,0.25)]"
          >
            <PlusCircle className="w-4 h-4" />
            {t('newTrade')}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {primaryMenu.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-slate-800" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/60 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </button>

          {isProfileOpen && (
            <div className="mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
              <Link
                to="/app/settings"
                state={{ activeTab: 'profile' }}
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <User className="w-4 h-4" /> {t('settings')}
              </Link>
              <Link
                to="/app/settings"
                state={{ activeTab: 'plan' }}
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <CreditCard className="w-4 h-4" /> Plan & Billing
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Гарах
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around px-2 py-2">
        {primaryMenu.slice(0, 5).map(item => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link key={item.key} to={item.path}
              className={cn("flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all", isActive ? "text-accent" : "text-slate-500")}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t(item.key).split(' ')[0]}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-accent"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('newTrade').split(' ')[0]}</span>
        </button>
      </nav>

      {isAddModalOpen && (
        <AddTradeModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </>
  );
}
