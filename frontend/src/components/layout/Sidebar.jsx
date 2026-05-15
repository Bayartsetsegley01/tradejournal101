import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen, BarChart2, Sparkles, Settings, PlusCircle,
  User, LogOut, BrainCircuit, CalendarDays, Shield, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { AddTradeModal } from "@/components/features/journal/AddTradeModal";
import { FeedbackModal } from "@/components/FeedbackModal";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLang();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const profileRef = useRef(null);

  const primaryMenu = [
    { key: "analytics",    icon: BarChart2,    path: "/app/analytics" },
    { key: "journal",      icon: BookOpen,     path: "/app/journal" },
    { key: "mistakes",     icon: BrainCircuit, path: "/app/mistakes" },
    { key: "aiAdvisor",    icon: Sparkles,     path: "/app/ai-advisor" },
    { key: "weeklyReview", icon: CalendarDays, path: "/app/weekly-review" },
    { key: "settings",     icon: Settings,     path: "/app/settings" },
  ];

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const fn = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const avatar = user?.avatar_url
    ? <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
    : <span>{user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}</span>;

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-slate-800/60 fixed top-0 left-0 h-screen shrink-0 z-40">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800/60">
          <Link to="/app/analytics" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shrink-0">
              <span className="text-slate-950 font-black text-sm leading-none">TJ</span>
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight block leading-none">TradeJournal</span>
              <span className="text-[10px] text-slate-600 font-medium">Pro Analytics</span>
            </div>
          </Link>
        </div>

        {/* Add Trade */}
        <div className="px-4 py-4">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-slate-950 font-bold text-sm py-2.5 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(200,240,122,0.12)] hover:shadow-[0_0_25px_rgba(200,240,122,0.22)] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            {t('newTrade')}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-1">
          {primaryMenu.map((item, i) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                to={item.path}
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-12px)',
                  transition: `opacity 280ms ease ${i * 45}ms, transform 280ms ease ${i * 45}ms`,
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-slate-500 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive ? "text-accent" : "text-slate-600 group-hover:text-slate-300"
                )} />
                <span>{t(item.key)}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Feedback */}
        <div className="px-3 pb-2">
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-300 hover:bg-slate-800/50 transition-all"
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            {t('feedback')}
          </button>
        </div>

        {/* User profile */}
        <div className="px-4 pb-4 pt-2 border-t border-slate-800/60" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/50 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0 overflow-hidden">
              {avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-none">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-600 truncate mt-0.5">{user?.email}</p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Online" />
          </button>

          {isProfileOpen && (
            <div className="mt-2 bg-slate-900 border border-slate-800/60 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
              <Link
                to="/app/settings"
                state={{ activeTab: 'profile' }}
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <User className="w-4 h-4" />
                {t('settings')}
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/60 flex items-center justify-around px-2 py-2 safe-area-bottom">
        {primaryMenu.slice(0, 5).map(item => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all",
                isActive ? "text-accent" : "text-slate-600 hover:text-slate-300"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{t(item.key).split(' ')[0]}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-accent"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] font-semibold">{t('newTrade').split(' ')[0]}</span>
        </button>
      </nav>

      {isAddModalOpen && (
        <AddTradeModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      )}
      {isFeedbackOpen && <FeedbackModal onClose={() => setIsFeedbackOpen(false)} />}
    </>
  );
}
