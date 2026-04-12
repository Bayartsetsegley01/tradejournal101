import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  BarChart2, 
  Sparkles, 
  Settings, 
  PlusCircle,
  User,
  CreditCard,
  LogOut,
  BrainCircuit,
  CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { AddTradeModal } from "@/components/features/journal/AddTradeModal";
import { useAuth } from "@/contexts/AuthContext";

const primaryMenu = [
  { name: "Анализ", icon: BarChart2, path: "/app/analytics" },
  { name: "Тэмдэглэл", icon: BookOpen, path: "/app/journal" },
  { name: "Алдаа & Сэтгэл зүй", icon: BrainCircuit, path: "/app/mistakes" },
  { name: "AI Зөвлөх", icon: Sparkles, path: "/app/ai-advisor" },
  { name: "Долоо хоногийн дүгнэлт", icon: CalendarDays, path: "/app/weekly-review" },
  { name: "Тохиргоо", icon: Settings, path: "/app/settings" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const { user, logout } = useAuth();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileNav = (tab) => {
    setIsProfileMenuOpen(false);
    navigate('/app/settings', { state: { activeTab: tab } });
  };

  const handleLogoutClick = () => {
    setIsProfileMenuOpen(false);
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    await logout();
    navigate('/login');
  };

  const displayName = user?.name || user?.email || 'User';
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <aside className="w-64 bg-slate-950 border-r border-slate-800 h-screen flex flex-col fixed left-0 top-0 text-slate-300 z-40">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
          <Link to="/app/analytics" className="flex items-center gap-2 text-white font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-slate-950" />
            </div>
            TradeJournal
          </Link>
        </div>

        {/* Primary Action */}
        <div className="p-4 shrink-0">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full bg-accent hover:bg-accent-hover text-slate-950 rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 font-bold transition-colors shadow-[0_0_15px_rgba(200,240,122,0.15)] hover:shadow-[0_0_20px_rgba(200,240,122,0.25)]"
          >
            <PlusCircle className="w-5 h-5" />
            Шинэ арилжаа
          </button>
        </div>

        {/* Main Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3 mt-2">Үндсэн цэс</div>
          {primaryMenu.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive 
                    ? "bg-accent/10 text-accent" 
                    : "hover:bg-slate-900 hover:text-white text-slate-400 hover:translate-x-1"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-transform duration-200", isActive ? "text-accent scale-110" : "text-slate-400 group-hover:scale-110")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-800 shrink-0 relative" ref={profileMenuRef}>
          <div 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${isProfileMenuOpen ? 'bg-slate-900' : 'hover:bg-slate-900'}`}
          >
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
              {getInitials(displayName)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-xs font-medium text-accent truncate">Free Plan</p>
            </div>
          </div>

          {/* Profile Popover */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
              <div className="px-4 py-2 border-b border-slate-700/50 mb-1">
                <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
              </div>
              <button onClick={() => handleProfileNav('profile')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                <User className="w-4 h-4" /> Миний профайл
              </button>
              <button onClick={() => handleProfileNav('plan')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                <CreditCard className="w-4 h-4" /> План / Subscription
              </button>
              <div className="h-px bg-slate-700/50 my-1" />
              <button 
                onClick={handleLogoutClick} 
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-400 hover:bg-slate-700 hover:text-rose-300 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Гарах
              </button>
            </div>
          )}
        </div>
      </aside>
      {isAddModalOpen && <AddTradeModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />}
      
      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Системээс гарах</h3>
            <p className="text-slate-400 text-sm mb-6">
              Та системээс гарахдаа итгэлтэй байна уу?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Үгүй, буцах
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-[0_0_15px_rgba(244,63,94,0.2)]"
              >
                Тийм, гарах
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
