import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Cell, PieChart, Pie,
} from "recharts";
import { TrendingUp, BarChart2, PieChart as PieIcon, Globe, Trophy, AlertTriangle, Zap, Activity } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const MNT_RATE = 3450;

const fmt = (v, cur) =>
  cur === '₮'
    ? `${v >= 0 ? '' : '-'}${Math.round(Math.abs(v) * MNT_RATE).toLocaleString()}₮`
    : `${v >= 0 ? '+' : '-'}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtAbs = (v, cur) =>
  cur === '₮'
    ? `${Math.round(Math.abs(v) * MNT_RATE).toLocaleString()}₮`
    : `$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// ── Glassmorphism Tooltip wrapper ──────────────────────────────────────────────
function GlassTooltipBox({ children }) {
  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-2xl px-3.5 py-3 shadow-2xl text-xs pointer-events-none">
      {children}
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
function EmptyChart({ label = "Өгөгдөл хангалтгүй" }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center">
        <Activity className="w-5 h-5 text-slate-600" />
      </div>
      <p className="text-slate-600 text-sm font-medium">{label}</p>
    </div>
  );
}

// ── KPI mini card ──────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, valueClass = "text-white", icon: Icon, iconColor }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-3.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{label}</span>
        {Icon && <Icon className={cn("w-3.5 h-3.5", iconColor || "text-slate-600")} />}
      </div>
      <span className={cn("text-xl font-bold leading-none", valueClass)}>{value}</span>
      {sub && <span className="text-[10px] text-slate-600">{sub}</span>}
    </div>
  );
}

// ── Tab 1: Дансны өсөлт ───────────────────────────────────────────────────────
function GrowthChart({ equityCurve, currency }) {
  if (!equityCurve?.length) return <EmptyChart label="Өсөлтийн өгөгдөл хангалтгүй" />;

  const data = equityCurve.map((d, i) => {
    const prev = i > 0 ? equityCurve[i - 1].equity : d.equity;
    const change = d.equity - prev;
    return {
      ...d,
      label: new Date(d.date).toLocaleDateString('en-CA', { month: '2-digit', day: '2-digit' }).replace('/', '-'),
      value: d.equity,
      change,
    };
  });

  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const totalChange = last - first;
  const pct = first !== 0 ? ((totalChange / Math.abs(first)) * 100).toFixed(1) : '0.0';
  const isUp = totalChange >= 0;
  const lineColor = isUp ? '#3b82f6' : '#f43f5e';
  const gradColor = isUp ? '#3b82f6' : '#f43f5e';

  const CustomTooltip = ({ active, payload, label: lbl }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <GlassTooltipBox>
        <p className="text-slate-400 mb-2 font-medium">{lbl}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-6">
            <span className="text-slate-500">Нийт дүн</span>
            <span className={cn("font-bold", d?.value >= 0 ? "text-blue-400" : "text-rose-400")}>
              {fmtAbs(d?.value ?? 0, currency)}
            </span>
          </div>
          {d?.change !== 0 && (
            <div className="flex justify-between gap-6">
              <span className="text-slate-500">Өөрчлөлт</span>
              <span className={cn("font-semibold", d?.change >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {d?.change >= 0 ? '+' : ''}{fmtAbs(d?.change ?? 0, currency)}
              </span>
            </div>
          )}
        </div>
      </GlassTooltipBox>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Summary header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">Нийт өсөлт</p>
          <p className={cn("text-2xl font-bold mt-0.5", isUp ? "text-blue-400" : "text-rose-400")}>
            {fmt(totalChange, currency)}
          </p>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border",
          isUp
            ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
        )}>
          <TrendingUp className={cn("w-3.5 h-3.5", !isUp && "rotate-180")} />
          {isUp ? '+' : ''}{pct}%
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="grad_growth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gradColor} stopOpacity={0.25} />
                <stop offset="75%" stopColor={gradColor} stopOpacity={0.04} />
                <stop offset="100%" stopColor={gradColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 8" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="transparent"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={8}
              tick={{ fill: '#475569' }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="transparent"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={54}
              tickFormatter={v => currency === '₮' ? `${Math.round(v * MNT_RATE / 1000)}K` : `$${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}`}
              tick={{ fill: '#475569' }}
            />
            <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 6" strokeOpacity={0.6} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: lineColor, strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.5 }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#grad_growth)"
              dot={false}
              activeDot={{ r: 5, fill: lineColor, stroke: '#0f172a', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Tab 2: Сарын гүйцэтгэл ────────────────────────────────────────────────────
function MonthlyChart({ byMonth, currency }) {
  if (!byMonth?.length) return <EmptyChart label="Сарын өгөгдөл хангалтгүй" />;

  const data = byMonth.map(d => ({
    ...d,
    label: d.month?.slice(0, 7) ?? d.month,
    isProfit: d.value >= 0,
  }));

  const totalPnl = data.reduce((s, d) => s + d.value, 0);
  const bestMonth = [...data].sort((a, b) => b.value - a.value)[0];
  const worstMonth = [...data].sort((a, b) => a.value - b.value)[0];

  const CustomTooltip = ({ active, payload, label: lbl }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <GlassTooltipBox>
        <p className="text-slate-400 mb-2 font-medium">{lbl}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-6">
            <span className="text-slate-500">P&L</span>
            <span className={cn("font-bold", d?.value >= 0 ? "text-blue-400" : "text-rose-400")}>
              {fmt(d?.value ?? 0, currency)}
            </span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-slate-500">Арилжаа</span>
            <span className="text-white font-semibold">{d?.trades}</span>
          </div>
          {d?.winRate !== undefined && (
            <div className="flex justify-between gap-6">
              <span className="text-slate-500">Win rate</span>
              <span className="text-white font-semibold">{d.winRate}%</span>
            </div>
          )}
        </div>
      </GlassTooltipBox>
    );
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2 shrink-0">
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-2.5 text-center">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Нийт</p>
          <p className={cn("text-sm font-bold", totalPnl >= 0 ? "text-blue-400" : "text-rose-400")}>{fmt(totalPnl, currency)}</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-2.5 text-center">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Шилдэг</p>
          <p className="text-sm font-bold text-blue-400">{bestMonth ? fmt(bestMonth.value, currency) : '—'}</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-2.5 text-center">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Муу</p>
          <p className="text-sm font-bold text-rose-400">{worstMonth ? fmt(worstMonth.value, currency) : '—'}</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={20}>
            <CartesianGrid strokeDasharray="3 8" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="transparent"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={6}
              tick={{ fill: '#475569' }}
            />
            <YAxis
              stroke="transparent"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={v => currency === '₮' ? `${Math.round(v * MNT_RATE / 1000)}K` : `$${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}`}
              tick={{ fill: '#475569' }}
            />
            <ReferenceLine y={0} stroke="#334155" strokeOpacity={0.8} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="value" radius={[6, 6, 2, 2]} isAnimationActive animationDuration={700} animationEasing="ease-out">
              {data.map((d, i) => (
                <Cell key={i} fill={d.value >= 0 ? '#3b82f6' : '#f43f5e'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Tab 3: Ашиг/Алдагдал ─────────────────────────────────────────────────────
function PnlChart({ winLoss, trades = [] }) {
  if (!winLoss?.length) return <EmptyChart label="Өгөгдөл хангалтгүй" />;

  const wins = winLoss.find(d => d.name === 'Ялалт')?.value ?? 0;
  const losses = winLoss.find(d => d.name === 'Ялагдал')?.value ?? 0;
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  // Compute streaks and best/worst from trades
  const sorted = useMemo(() => {
    return [...trades]
      .filter(t => t.status === 'CLOSED' && t.pnl != null)
      .sort((a, b) => new Date(a.entry_date || a.date) - new Date(b.entry_date || b.date));
  }, [trades]);

  const { winStreak, lossStreak, bestTrade, worstTrade } = useMemo(() => {
    let maxWin = 0, maxLoss = 0, curWin = 0, curLoss = 0;
    let best = null, worst = null;
    sorted.forEach(t => {
      const p = parseFloat(t.pnl);
      if (isNaN(p)) return;
      if (p > 0) { curWin++; curLoss = 0; maxWin = Math.max(maxWin, curWin); }
      else { curLoss++; curWin = 0; maxLoss = Math.max(maxLoss, curLoss); }
      if (!best || p > parseFloat(best.pnl)) best = t;
      if (!worst || p < parseFloat(worst.pnl)) worst = t;
    });
    return { winStreak: maxWin, lossStreak: maxLoss, bestTrade: best, worstTrade: worst };
  }, [sorted]);

  const donutData = [{ name: 'Ялалт', value: wins }, { name: 'Ялагдал', value: losses }];
  const isGoodWinRate = winRate >= 50;

  return (
    <div className="h-full flex gap-4 items-stretch">
      {/* Donut */}
      <div className="flex flex-col items-center justify-center shrink-0" style={{ width: 140 }}>
        <div className="relative" style={{ width: 130, height: 130 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                isAnimationActive
                animationDuration={800}
                strokeWidth={0}
              >
                <Cell fill="#3b82f6" />
                <Cell fill="#f43f5e" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={cn("text-xl font-bold leading-none", isGoodWinRate ? "text-blue-400" : "text-rose-400")}>
              {winRate}%
            </span>
            <span className="text-[9px] text-slate-500 mt-0.5 font-medium uppercase tracking-wider">Win Rate</span>
          </div>
        </div>
        {/* Legend */}
        <div className="mt-2 space-y-1.5 w-full px-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 shrink-0" />
            <span className="text-[10px] text-slate-400 flex-1">Ашигтай</span>
            <span className="text-[10px] font-bold text-white">{wins}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-rose-500 shrink-0" />
            <span className="text-[10px] text-slate-400 flex-1">Алдагдалтай</span>
            <span className="text-[10px] font-bold text-white">{losses}</span>
          </div>
        </div>
      </div>

      {/* Right KPIs */}
      <div className="flex-1 grid grid-cols-2 gap-2 content-start">
        <KpiCard
          label="Макс ялалтын streak"
          value={winStreak > 0 ? `${winStreak} дараалал` : '—'}
          valueClass="text-blue-400 text-base"
          icon={Zap}
          iconColor="text-blue-500"
        />
        <KpiCard
          label="Макс алдагдлын streak"
          value={lossStreak > 0 ? `${lossStreak} дараалал` : '—'}
          valueClass="text-rose-400 text-base"
          icon={AlertTriangle}
          iconColor="text-rose-500"
        />
        <KpiCard
          label="Шилдэг арилжаа"
          value={bestTrade ? fmt(parseFloat(bestTrade.pnl), '$') : '—'}
          sub={bestTrade?.symbol ? `${bestTrade.symbol} • ${bestTrade.direction}` : undefined}
          valueClass="text-emerald-400 text-base"
          icon={Trophy}
          iconColor="text-amber-500"
        />
        <KpiCard
          label="Хамгийн муу арилжаа"
          value={worstTrade ? fmt(parseFloat(worstTrade.pnl), '$') : '—'}
          sub={worstTrade?.symbol ? `${worstTrade.symbol} • ${worstTrade.direction}` : undefined}
          valueClass="text-rose-400 text-base"
        />
        <div className="col-span-2 bg-slate-800/40 border border-slate-700/30 rounded-2xl p-3 flex items-center justify-around">
          <div className="text-center">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Нийт арилжаа</p>
            <p className="text-lg font-bold text-white">{total}</p>
          </div>
          <div className="w-px h-8 bg-slate-700/50" />
          <div className="text-center">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Ашигтай</p>
            <p className="text-lg font-bold text-blue-400">{wins}</p>
          </div>
          <div className="w-px h-8 bg-slate-700/50" />
          <div className="text-center">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Алдагдалтай</p>
            <p className="text-lg font-bold text-rose-400">{losses}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab 4: Session статистик ──────────────────────────────────────────────────
function SessionChart({ bySession, currency }) {
  if (!bySession?.length) return <EmptyChart label="Session өгөгдөл хангалтгүй" />;

  const sorted = [...bySession].sort((a, b) => b.value - a.value);
  const best = sorted[0];
  const totalPnl = bySession.reduce((s, d) => s + d.value, 0);

  const SESSION_ICONS = { tokyo: '🌸', london: '🏦', 'new york': '🗽', sydney: '🦘' };

  const CustomTooltip = ({ active, payload, label: lbl }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <GlassTooltipBox>
        <p className="text-slate-400 mb-2 font-medium">{lbl}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-6">
            <span className="text-slate-500">P&L</span>
            <span className={cn("font-bold", d?.value >= 0 ? "text-blue-400" : "text-rose-400")}>
              {fmt(d?.value ?? 0, currency)}
            </span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-slate-500">Арилжаа</span>
            <span className="text-white font-semibold">{d?.trades}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-slate-500">Win rate</span>
            <span className={cn("font-semibold", d?.winRate >= 50 ? "text-blue-400" : "text-rose-400")}>{d?.winRate}%</span>
          </div>
        </div>
      </GlassTooltipBox>
    );
  };

  return (
    <div className="h-full flex gap-4">
      {/* Bar chart */}
      <div className="flex-1 min-w-0 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bySession} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={28}>
            <CartesianGrid strokeDasharray="3 8" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="transparent"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8' }}
              dy={6}
            />
            <YAxis
              stroke="transparent"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={v => currency === '₮' ? `${Math.round(v * MNT_RATE / 1000)}K` : `$${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}`}
              tick={{ fill: '#475569' }}
            />
            <ReferenceLine y={0} stroke="#334155" strokeOpacity={0.8} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="value" radius={[8, 8, 2, 2]} isAnimationActive animationDuration={700}>
              {bySession.map((d, i) => (
                <Cell key={i} fill={d.value >= 0 ? '#3b82f6' : '#f43f5e'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Session cards */}
      <div className="w-40 shrink-0 flex flex-col gap-2 overflow-y-auto">
        {sorted.map((d, i) => {
          const isBest = d.key === best?.key;
          const icon = SESSION_ICONS[d.key?.toLowerCase()] || SESSION_ICONS[d.name?.toLowerCase()] || '🌐';
          return (
            <div key={i} className={cn(
              "border rounded-2xl p-3 shrink-0 transition-all",
              isBest
                ? "bg-blue-500/10 border-blue-500/25"
                : "bg-slate-800/40 border-slate-700/30"
            )}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-base">{icon}</span>
                {isBest && <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/20 px-1.5 py-0.5 rounded-full">Шилдэг</span>}
              </div>
              <p className={cn("text-[11px] font-semibold mb-0.5", isBest ? "text-blue-300" : "text-slate-200")}>{d.name}</p>
              <p className={cn("text-sm font-bold", d.value >= 0 ? "text-blue-400" : "text-rose-400")}>
                {fmt(d.value, currency)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {d.trades} арилжаа · <span className={d.winRate >= 50 ? "text-blue-400" : "text-rose-400"}>{d.winRate}%</span>
              </p>
            </div>
          );
        })}
        {/* Total strip */}
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-3 shrink-0 mt-auto">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Нийт</p>
          <p className={cn("text-sm font-bold", totalPnl >= 0 ? "text-blue-400" : "text-rose-400")}>
            {fmt(totalPnl, currency)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'growth',  label: 'Дансны өсөлт',      icon: TrendingUp },
  { id: 'monthly', label: 'Сарын гүйцэтгэл',   icon: BarChart2 },
  { id: 'pnl',     label: 'Ашиг/Алдагдал',     icon: PieIcon },
  { id: 'session', label: 'Session',            icon: Globe },
];

export function ChartWithTabs({ equityCurve = [], perfData = null, trades = [], currency = '$' }) {
  const [tab, setTab] = useState('growth');

  return (
    <div
      className="bg-slate-900 border border-slate-800/60 rounded-2xl flex flex-col hover:border-slate-700/80 transition-all duration-300 shadow-xl shadow-black/20"
      style={{ height: 400 }}
    >
      {/* ── Segmented tab bar ── */}
      <div className="px-4 pt-3.5 pb-0 shrink-0">
        <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1">
          {TABS.map(t => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-semibold transition-all duration-200 whitespace-nowrap',
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm shadow-black/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/40'
                )}
              >
                <t.icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-slate-700" : "")} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chart area ── */}
      <div className="flex-1 px-4 pb-4 pt-3 min-h-0 overflow-hidden">
        {tab === 'growth'  && <GrowthChart  equityCurve={equityCurve} currency={currency} />}
        {tab === 'monthly' && <MonthlyChart byMonth={perfData?.byMonth} currency={currency} />}
        {tab === 'pnl'     && <PnlChart     winLoss={perfData?.winLoss} trades={trades} />}
        {tab === 'session' && <SessionChart bySession={perfData?.bySession} currency={currency} />}
      </div>
    </div>
  );
}
