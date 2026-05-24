import { useEffect, useState, useCallback } from "react";
import { Users, TrendingUp, MessageSquare, UserCheck, RefreshCw, Download, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Cell,
} from "recharts";
import { getDashboardStats } from "@/services/adminService";

const MN_MONTHS = ['1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар','7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар'];
const fmtMonth = (m) => {
  if (!m || !m.includes('-')) return m;
  const [y, mo] = m.split('-');
  return `${y} ${MN_MONTHS[parseInt(mo, 10) - 1] || ''}`;
};
const fmtMonthShort = (m) => {
  if (!m || !m.includes('-')) return m;
  const [, mo] = m.split('-');
  return MN_MONTHS[parseInt(mo, 10) - 1]?.replace('-р сар', '') + ' сар' || m;
};

const MARKET_LABELS = {
  forex: 'Форекс', crypto: 'Крипто', gold: 'Алт', xauusd: 'Алт',
  commodity: 'Түүхий эд', stocks: 'Хувьцаа', indices: 'Индекс',
  futures: 'Фьючерс', options: 'Опцион',
};
const fmtMarket = (v) => MARKET_LABELS[v?.toLowerCase()] || v;

const BAR_COLORS = ['#c8f07a', '#67e8f9', '#a78bfa', '#f9a8d4', '#fbbf24', '#34d399'];

// ── Custom Tooltips ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, labelFormatter, valueLabel = 'Тоо' }) {
  if (!active || !payload?.length) return null;
  const displayLabel = labelFormatter ? labelFormatter(label) : label;
  return (
    <div className="bg-slate-800/95 border border-slate-700 rounded-xl px-3.5 py-2.5 shadow-2xl backdrop-blur-sm">
      <p className="text-xs font-semibold text-slate-300 mb-1.5">{displayLabel}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill || '#c8f07a' }} />
          <span className="text-xs text-slate-400">{valueLabel}:</span>
          <span className="text-sm font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = "accent", trend }) => {
  const palettes = {
    blue:    { bg: 'bg-blue-500/10',    icon: 'text-blue-400',    border: 'hover:border-blue-500/30' },
    emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'hover:border-emerald-500/30' },
    amber:   { bg: 'bg-amber-500/10',   icon: 'text-amber-400',   border: 'hover:border-amber-500/30' },
    accent:  { bg: 'bg-accent/10',      icon: 'text-accent',      border: 'hover:border-accent/30' },
  };
  const p = palettes[color] || palettes.accent;
  return (
    <div className={`relative bg-slate-900 border border-slate-800 ${p.border} rounded-2xl p-5 transition-all duration-300 overflow-hidden group`}>
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.02) 0%, transparent 70%)' }} />
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${p.icon}`} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
            {trend > 0 ? `+${trend}` : trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-white tracking-tight">{value ?? '—'}</p>
      <p className="text-sm font-medium text-slate-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
    </div>
  );
};

// ── Empty chart placeholder ────────────────────────────────────────────────────
const EmptyChart = ({ height = 220 }) => (
  <div className={`flex flex-col items-center justify-center gap-2`} style={{ height }}>
    <Activity className="w-8 h-8 text-slate-700" />
    <p className="text-sm text-slate-600">Өгөгдөл байхгүй</p>
  </div>
);

export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    getDashboardStats()
      .then(d => { setData(d); setLastRefresh(new Date()); })
      .catch(() => setError('Өгөгдөл ачаалахад алдаа гарлаа'))
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
    a.href = url; a.download = `dashboard_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading && !data) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Уншиж байна...</p>
      </div>
    </div>
  );
  if (error) return <div className="p-8 text-rose-400 text-sm">{error}</div>;
  if (!data) return null;

  const { stats, topAssets, registrationTrend, tradingTrend } = data;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Хяналтын самбар</h1>
          <p className="text-sm text-slate-500 mt-1">Платформын тойм · Render.com</p>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-slate-600 hidden sm:block">
              {lastRefresh.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Шинэчлэх</span>
          </button>
          <button onClick={exportCSV} title="Платформын статистикийг CSV-р татах"
            className="flex items-center gap-1.5 px-3 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-xl text-sm font-medium transition-colors border border-accent/20">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV татах</span>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users} label="Нийт хэрэглэгч" color="blue"
          value={stats.total_users} trend={stats.new_users_week}
          sub={`${stats.inactive_users} идэвхгүй`}
        />
        <StatCard
          icon={UserCheck} label="Идэвхтэй" color="emerald"
          value={stats.active_users}
          sub={`Нийт ${stats.total_users}-аас`}
        />
        <StatCard
          icon={TrendingUp} label="Нийт арилжаа" color="emerald"
          value={stats.total_trades} trend={stats.trades_this_week}
          sub="7 хоногийн өсөлт"
        />
        <StatCard
          icon={MessageSquare} label="Хүлээгдэж буй санал" color="amber"
          value={stats.pending_feedback}
          sub="Хянах шаардлагатай"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top Assets bar chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white">Хамгийн их ашигласан зах зээл</h2>
              <p className="text-xs text-slate-500 mt-0.5">Арилжааны тоогоор эрэмбэлсэн</p>
            </div>
            <span className="text-xs text-slate-600 bg-slate-800 px-2 py-1 rounded-lg">{topAssets.length} зах зээл</span>
          </div>
          {topAssets.length === 0 ? <EmptyChart height={220} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topAssets} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="market_type" tickFormatter={fmtMarket}
                  tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
                />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  content={<ChartTooltip labelFormatter={fmtMarket} valueLabel="Арилжаа" />}
                  cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }}
                />
                <Bar dataKey="trade_count" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={700}>
                  {topAssets.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Registration trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white">Бүртгэлүүд</h2>
              <p className="text-xs text-slate-500 mt-0.5">Сүүлийн 6 сарын динамик</p>
            </div>
            <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">
              Нийт {registrationTrend.reduce((s, r) => s + r.count, 0)}
            </span>
          </div>
          {registrationTrend.length === 0 ? <EmptyChart height={220} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={registrationTrend} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="month" tickFormatter={fmtMonthShort}
                  tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
                />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip labelFormatter={fmtMonth} valueLabel="Бүртгэл" />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 2' }} />
                <Area
                  type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#regGrad)"
                  strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#3b82f6', stroke: '#1e3a5f', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Trading activity */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-white">Арилжааны идэвхжил</h2>
            <p className="text-xs text-slate-500 mt-0.5">Сүүлийн 6 сарын арилжааны тоо (оролтын огноогоор)</p>
          </div>
          <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-1 rounded-lg">
            Нийт {tradingTrend.reduce((s, r) => s + r.count, 0)} арилжаа
          </span>
        </div>
        {tradingTrend.length === 0 ? <EmptyChart height={200} /> : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={tradingTrend} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="tradeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#c8f07a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c8f07a" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="month" tickFormatter={fmtMonthShort}
                tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
              />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip labelFormatter={fmtMonth} valueLabel="Арилжаа" />} cursor={{ stroke: '#c8f07a', strokeWidth: 1, strokeDasharray: '4 2' }} />
              <Area
                type="monotone" dataKey="count" stroke="#c8f07a" fill="url(#tradeGrad)"
                strokeWidth={2.5} dot={{ r: 3, fill: '#c8f07a', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#c8f07a', stroke: '#2d3a1a', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}
