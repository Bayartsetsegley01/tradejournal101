import { useEffect, useState, useCallback } from "react";
import { Users, TrendingUp, MessageSquare, UserCheck, RefreshCw, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from "recharts";
import { getDashboardStats } from "@/services/adminService";

const MN_MONTHS = ['1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар','7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар'];
const fmtMonth = (m) => {
  if (!m || !m.includes('-')) return m;
  const [y, mo] = m.split('-');
  return `${y} ${MN_MONTHS[parseInt(mo, 10) - 1] || ''}`;
};

const MARKET_LABELS = {
  forex: 'Форекс', crypto: 'Крипто', gold: 'Алт', xauusd: 'Алт',
  commodity: 'Түүхий эд', stocks: 'Хувьцаа', indices: 'Индекс',
  futures: 'Фьючерс', options: 'Опцион',
};
const fmtMarket = (v) => MARKET_LABELS[v?.toLowerCase()] || v;

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 },
  labelStyle: { color: '#fff' },
};

const StatCard = ({ icon: Icon, label, value, sub, color = "accent" }) => {
  const colors = {
    accent:  "bg-accent/10 text-accent",
    blue:    "bg-blue-500/10 text-blue-400",
    rose:    "bg-rose-500/10 text-rose-400",
    amber:   "bg-amber-500/10 text-amber-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-accent/20 transition-colors duration-300">
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
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    getDashboardStats()
      .then(d => { setData(d); setLastRefresh(new Date()); })
      .catch(() => setError("Өгөгдөл ачаалахад алдаа гарлаа"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const exportCSV = () => {
    if (!data) return;
    const { stats } = data;
    const rows = [
      ['Үзүүлэлт', 'Утга'],
      ['Нийт хэрэглэгч', stats.total_users],
      ['Идэвхтэй хэрэглэгч', stats.active_users],
      ['Идэвхгүй хэрэглэгч', stats.inactive_users],
      ['Шинэ хэрэглэгч (7 хоног)', stats.new_users_week],
      ['Нийт арилжаа', stats.total_trades],
      ['Арилжаа (7 хоног)', stats.trades_this_week],
      ['Хүлээгдэж буй санал хүсэлт', stats.pending_feedback],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !data) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="p-8 text-rose-400">{error}</div>;
  if (!data) return null;

  const { stats, topAssets, registrationTrend, tradingTrend } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Хяналтын самбар</h1>
          <p className="text-slate-400 text-sm mt-1">Платформын тойм</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-slate-500">
              Шинэчлэгдсэн {lastRefresh.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Шинэчлэх
          </button>
          <button
            onClick={exportCSV}
            title="Платформын үзүүлэлтүүдийг CSV файлаар татаж авах"
            className="flex items-center gap-2 px-3 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-xl text-sm font-medium transition-colors border border-accent/20"
          >
            <Download className="w-3.5 h-3.5" />
            CSV татах
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users} label="Нийт хэрэглэгч"
          value={stats.total_users} sub={`+${stats.new_users_week} энэ долоо хоногт`}
          color="blue"
        />
        <StatCard
          icon={UserCheck} label="Идэвхтэй"
          value={stats.active_users} sub={`${stats.inactive_users} идэвхгүй`}
          color="emerald"
        />
        <StatCard
          icon={TrendingUp} label="Нийт арилжаа"
          value={stats.total_trades} sub={`+${stats.trades_this_week} энэ долоо хоногт`}
          color="emerald"
        />
        <StatCard
          icon={MessageSquare} label="Хүлээгдэж буй санал"
          value={stats.pending_feedback} sub="Хянах шаардлагатай"
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Assets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Хамгийн их ашигласан зах зээл</h2>
          {topAssets.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Өгөгдөл байхгүй</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topAssets} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="market_type" tickFormatter={fmtMarket} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Арилжаа']} labelFormatter={fmtMarket} />
                <Bar dataKey="trade_count" fill="#c8f07a" radius={[4, 4, 0, 0]} name="Арилжаа" isAnimationActive animationDuration={600} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Registration trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Бүртгэлүүд (6 сар)</h2>
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
                <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Бүртгэл']} labelFormatter={fmtMonth} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#regGrad)" strokeWidth={2} name="Бүртгэл" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Trading trend */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Арилжааны идэвхжил (6 сар)</h2>
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
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Арилжаа']} labelFormatter={fmtMonth} />
              <Area type="monotone" dataKey="count" stroke="#c8f07a" fill="url(#tradeGrad)" strokeWidth={2} name="Арилжаа" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
