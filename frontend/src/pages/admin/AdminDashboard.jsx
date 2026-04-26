import { useEffect, useState } from "react";
import { Users, TrendingUp, MessageSquare, UserCheck, UserX, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from "recharts";
import { getDashboardStats } from "@/services/adminService";

const StatCard = ({ icon: Icon, label, value, sub, color = "accent" }) => {
  const colors = {
    accent: "bg-accent/10 text-accent",
    blue: "bg-blue-500/10 text-blue-400",
    rose: "bg-rose-500/10 text-rose-400",
    amber: "bg-amber-500/10 text-amber-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value ?? "—"}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
};

export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardStats()
      .then(setData)
      .catch(() => setError("Өгөгдөл татахад алдаа гарлаа"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="p-8 text-rose-400">{error}</div>;

  const { stats, topAssets, registrationTrend, tradingTrend } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Платформын ерөнхий байдал</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Нийт хэрэглэгч" value={stats.total_users} sub={`+${stats.new_users_week} энэ долоо хоног`} color="blue" />
        <StatCard icon={UserCheck} label="Идэвхтэй" value={stats.active_users} sub={`${stats.inactive_users} идэвхгүй`} color="emerald" />
        <StatCard icon={TrendingUp} label="Нийт trade" value={stats.total_trades} sub={`+${stats.trades_this_week} энэ долоо хоног`} color="accent" />
        <StatCard icon={MessageSquare} label="Шинэ feedback" value={stats.pending_feedback} sub="Хариулаагүй" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Assets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Хамгийн их ашиглагдсан asset</h2>
          {topAssets.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Өгөгдөл байхгүй</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topAssets} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="market_type" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
                <Bar dataKey="trade_count" fill="#c8f07a" radius={[4, 4, 0, 0]} name="Trade тоо" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Registration trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Бүртгэлийн динамик (6 сар)</h2>
          {registrationTrend.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Өгөгдөл байхгүй</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={registrationTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#regGrad)" strokeWidth={2} name="Бүртгэл" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Trading trend */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Trading идэвх (6 сар)</h2>
        {tradingTrend.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">Өгөгдөл байхгүй</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={tradingTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tradeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c8f07a" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#c8f07a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
              <Area type="monotone" dataKey="count" stroke="#c8f07a" fill="url(#tradeGrad)" strokeWidth={2} name="Trade" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
