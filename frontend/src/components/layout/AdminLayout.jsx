import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, MessageSquare, Settings, ArrowLeft, BarChart2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Хэрэглэгчид", icon: Users, path: "/admin/users" },
  { label: "Feedback", icon: MessageSquare, path: "/admin/feedback" },
  { label: "Тохиргоо", icon: Settings, path: "/admin/settings" },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-slate-950 border-r border-slate-800 fixed top-0 left-0 h-screen z-40">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Admin Panel</p>
              <p className="text-xs text-slate-500">TradeJournal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(item => {
            const active = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active ? "bg-rose-500/10 text-rose-400" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}>
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link to="/app/analytics"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors">
            <ArrowLeft className="w-4 h-4" /> App руу буцах
          </Link>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 text-xs font-bold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <span className="text-xs text-slate-500 truncate">{user?.email}</span>
          </div>
        </div>
      </aside>

      <main className="pl-60 w-full min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
