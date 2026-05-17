import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Cell, PieChart, Pie,
} from "recharts";
import { TrendingUp, BarChart2, PieChart as PieIcon, Globe, Activity } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const MNT_RATE = 3450;

// Unsigned format — for neutral display
const fmtAbs = (v, cur) =>
  cur === '₮'
    ? `${Math.round(Math.abs(v) * MNT_RATE).toLocaleString()}₮`
    : `$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// Signed format — for P&L headers/totals
const fmtSigned = (v, cur) =>
  `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmtAbs(v, cur)}`;

// Value-based color helpers
const pnlColor   = (v) => v >= 0 ? '#3b82f6' : '#f43f5e';
const pnlTextCls = (v) => v >= 0 ? 'text-blue-400' : 'text-rose-400';

// ── Shared tooltip ─────────────────────────────────────────────────────────────
function Tip({ children }) {
  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl px-3 py-2.5 shadow-xl text-xs min-w-[130px] pointer-events-none">
      {children}
    </div>
  );
}

// ── Shared empty state ─────────────────────────────────────────────────────────
function Empty({ label = "Өгөгдөл хангалтгүй" }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2.5">
      <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center">
        <Activity className="w-4 h-4 text-slate-700" />
      </div>
      <p className="text-slate-600 text-[13px]">{label}</p>
    </div>
  );
}

// ── Shared axis props ──────────────────────────────────────────────────────────
const axisProps = {
  stroke: "transparent",
  tickLine: false,
  axisLine: false,
  tick: { fill: '#475569', fontSize: 10 },
};

const yFmt = (v, cur) => {
  const abs = Math.abs(v);
  const s = cur === '₮'
    ? `${Math.round(abs * MNT_RATE / 1000)}K₮`
    : abs >= 1000 ? `$${(abs / 1000).toFixed(0)}K` : `$${abs}`;
  return v < 0 ? `−${s}` : s;
};

// ══════════════════════════════════════════════════════════════════════════════
// Tab 1 — Дансны өсөлт
// ══════════════════════════════════════════════════════════════════════════════
function GrowthChart({ equityCurve, currency }) {
  if (!equityCurve?.length) return <Empty label="Өсөлтийн өгөгдөл хангалтгүй" />;

  // equityCurve[i].equity = cumulative P&L from 0 — total is the LAST value, not last−first
  const data = equityCurve.map((d, i) => ({
    label: new Date(d.date).toLocaleDateString('en-CA', { month: '2-digit', day: '2-digit' }).replace(/\//g, '-'),
    value: parseFloat(d.equity) || 0,
    pnl:   parseFloat(d.pnl)    || 0,
  }));

  const total = data[data.length - 1]?.value ?? 0;
  const isUp  = total >= 0;
  const color = pnlColor(total);

  const TooltipContent = ({ active, payload, label: lbl }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <Tip>
        <p className="text-slate-500 mb-1.5 text-[11px]">{lbl}</p>
        <div className="flex justify-between gap-5 mb-0.5">
          <span className="text-slate-400">Нийт P&L</span>
          <span className={cn("font-semibold", pnlTextCls(d.value))}>{fmtSigned(d.value, currency)}</span>
        </div>
        <div className="flex justify-between gap-5">
          <span className="text-slate-400">Энэ арилжаа</span>
          <span className={cn("font-semibold", pnlTextCls(d.pnl))}>{fmtSigned(d.pnl, currency)}</span>
        </div>
      </Tip>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Mini header */}
      <div className="flex items-baseline gap-3 mb-2 shrink-0">
        <span className={cn("text-2xl font-bold tracking-tight", pnlTextCls(total))}>
          {fmtSigned(total, currency)}
        </span>
        <span className="text-xs text-slate-500">нийт P&L</span>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 2, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="g_growth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 10" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="label" {...axisProps} dy={6} interval="preserveStartEnd" />
            <YAxis {...axisProps} width={52} tickFormatter={v => yFmt(v, currency)} />
            <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 6" strokeOpacity={0.5} />
            <Tooltip content={<TooltipContent />} cursor={{ stroke: color, strokeWidth: 1, strokeOpacity: 0.3 }} />
            <Area
              type="monotone" dataKey="value"
              stroke={color} strokeWidth={1.5}
              fill="url(#g_growth)" dot={false}
              activeDot={{ r: 4, fill: color, stroke: '#0f172a', strokeWidth: 2 }}
              isAnimationActive animationDuration={700}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Tab 2 — Сарын гүйцэтгэл
// ══════════════════════════════════════════════════════════════════════════════
function MonthlyChart({ byMonth, currency }) {
  if (!byMonth?.length) return <Empty label="Сарын өгөгдөл хангалтгүй" />;

  const data = byMonth.map(d => ({
    ...d,
    label: d.month?.slice(0, 7) ?? d.month,
    value: parseFloat(d.value) || 0,
  }));

  const total = data.reduce((s, d) => s + d.value, 0);

  const TooltipContent = ({ active, payload, label: lbl }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <Tip>
        <p className="text-slate-500 mb-1.5 text-[11px]">{lbl}</p>
        <div className="flex justify-between gap-5 mb-0.5">
          <span className="text-slate-400">P&L</span>
          <span className={cn("font-semibold", pnlTextCls(d.value))}>{fmtSigned(d.value, currency)}</span>
        </div>
        <div className="flex justify-between gap-5 mb-0.5">
          <span className="text-slate-400">Арилжаа</span>
          <span className="text-slate-200 font-semibold">{d.trades}</span>
        </div>
        {d.winRate !== undefined && (
          <div className="flex justify-between gap-5">
            <span className="text-slate-400">Win rate</span>
            <span className="text-slate-200 font-semibold">{d.winRate}%</span>
          </div>
        )}
      </Tip>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-baseline gap-3 mb-2 shrink-0">
        <span className={cn("text-2xl font-bold tracking-tight", pnlTextCls(total))}>
          {fmtSigned(total, currency)}
        </span>
        <span className="text-xs text-slate-500">нийт · {data.length} сар</span>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 2, left: -8, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="2 10" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="label" {...axisProps} dy={6} />
            <YAxis {...axisProps} width={52} tickFormatter={v => yFmt(v, currency)} />
            <ReferenceLine y={0} stroke="#334155" strokeOpacity={0.6} />
            <Tooltip content={<TooltipContent />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="value" radius={[4, 4, 1, 1]} isAnimationActive animationDuration={600}>
              {data.map((d, i) => (
                <Cell key={i} fill={pnlColor(d.value)} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Tab 3 — Ашиг/Алдагдал
// ══════════════════════════════════════════════════════════════════════════════
function PnlChart({ winLoss, trades = [] }) {
  if (!winLoss?.length) return <Empty label="Өгөгдөл хангалтгүй" />;

  const wins   = winLoss.find(d => d.name === 'Ялалт')?.value   ?? 0;
  const losses = winLoss.find(d => d.name === 'Ялагдал')?.value ?? 0;
  const total  = wins + losses;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';

  const sorted = useMemo(() =>
    [...trades]
      .filter(t => t.status === 'CLOSED' && t.pnl != null)
      .sort((a, b) => new Date(a.entry_date || a.date) - new Date(b.entry_date || b.date)),
  [trades]);

  const { winStreak, lossStreak, bestTrade, worstTrade } = useMemo(() => {
    let maxWin = 0, maxLoss = 0, curWin = 0, curLoss = 0;
    let best = null, worst = null;
    sorted.forEach(t => {
      const p = parseFloat(t.pnl);
      if (isNaN(p)) return;
      if (p > 0) { curWin++; curLoss = 0; maxWin = Math.max(maxWin, curWin); }
      else        { curLoss++; curWin = 0; maxLoss = Math.max(maxLoss, curLoss); }
      if (!best  || p > parseFloat(best.pnl))  best  = t;
      if (!worst || p < parseFloat(worst.pnl)) worst = t;
    });
    return { winStreak: maxWin, lossStreak: maxLoss, bestTrade: best, worstTrade: worst };
  }, [sorted]);

  const donutData = [
    { name: 'Ялалт',    value: wins },
    { name: 'Ялагдал',  value: losses },
  ];

  const Row = ({ label, value, valueCls }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-800/60 last:border-0">
      <span className="text-[13px] text-slate-400">{label}</span>
      <span className={cn("text-[13px] font-semibold", valueCls || 'text-slate-200')}>{value}</span>
    </div>
  );

  return (
    <div className="h-full flex gap-6 items-center">
      {/* Donut */}
      <div className="flex flex-col items-center shrink-0" style={{ width: 150 }}>
        <div className="relative" style={{ width: 140, height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData} cx="50%" cy="50%"
                innerRadius={48} outerRadius={64}
                paddingAngle={2} dataKey="value"
                startAngle={90} endAngle={-270}
                strokeWidth={0}
                isAnimationActive animationDuration={700}
              >
                <Cell fill="#3b82f6" />
                <Cell fill="#f43f5e" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={cn("text-2xl font-bold leading-none", parseFloat(winRate) >= 50 ? 'text-blue-400' : 'text-rose-400')}>
              {winRate}%
            </span>
            <span className="text-[10px] text-slate-600 mt-1">Win rate</span>
          </div>
        </div>

        <div className="mt-3 w-full space-y-1.5 px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[11px] text-slate-500 flex-1">Ашигтай</span>
            <span className="text-[11px] font-semibold text-slate-300">{wins}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[11px] text-slate-500 flex-1">Алдагдалтай</span>
            <span className="text-[11px] font-semibold text-slate-300">{losses}</span>
          </div>
        </div>
      </div>

      {/* Stats list */}
      <div className="flex-1 self-stretch flex flex-col justify-center">
        <Row
          label="Ялалтын дараалал"
          value={winStreak > 0 ? `${winStreak} арилжаа` : '—'}
          valueCls="text-blue-400"
        />
        <Row
          label="Алдагдлын дараалал"
          value={lossStreak > 0 ? `${lossStreak} арилжаа` : '—'}
          valueCls="text-rose-400"
        />
        <Row
          label="Шилдэг арилжаа"
          value={bestTrade ? fmtSigned(parseFloat(bestTrade.pnl), '$') : '—'}
          valueCls={bestTrade ? pnlTextCls(parseFloat(bestTrade.pnl)) : 'text-slate-500'}
        />
        <Row
          label="Хамгийн муу арилжаа"
          value={worstTrade ? fmtSigned(parseFloat(worstTrade.pnl), '$') : '—'}
          valueCls={worstTrade ? pnlTextCls(parseFloat(worstTrade.pnl)) : 'text-slate-500'}
        />
        <Row
          label="Нийт арилжаа"
          value={total}
          valueCls="text-slate-200"
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Tab 4 — Session
// ══════════════════════════════════════════════════════════════════════════════
function SessionChart({ bySession, currency }) {
  if (!bySession?.length) return <Empty label="Session өгөгдөл хангалтгүй" />;

  const data = bySession.map(d => ({ ...d, value: parseFloat(d.value) || 0 }));
  const total = data.reduce((s, d) => s + d.value, 0);

  const TooltipContent = ({ active, payload, label: lbl }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <Tip>
        <p className="text-slate-500 mb-1.5 text-[11px]">{lbl}</p>
        <div className="flex justify-between gap-5 mb-0.5">
          <span className="text-slate-400">P&L</span>
          <span className={cn("font-semibold", pnlTextCls(d.value))}>{fmtSigned(d.value, currency)}</span>
        </div>
        <div className="flex justify-between gap-5 mb-0.5">
          <span className="text-slate-400">Арилжаа</span>
          <span className="text-slate-200 font-semibold">{d.trades}</span>
        </div>
        <div className="flex justify-between gap-5">
          <span className="text-slate-400">Win rate</span>
          <span className={cn("font-semibold", d.winRate >= 50 ? 'text-blue-400' : 'text-rose-400')}>{d.winRate}%</span>
        </div>
      </Tip>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-baseline gap-3 mb-2 shrink-0">
        <span className={cn("text-2xl font-bold tracking-tight", pnlTextCls(total))}>
          {fmtSigned(total, currency)}
        </span>
        <span className="text-xs text-slate-500">нийт session P&L</span>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 2, left: -8, bottom: 0 }} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="2 10" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" {...axisProps} dy={6} tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis {...axisProps} width={52} tickFormatter={v => yFmt(v, currency)} />
            <ReferenceLine y={0} stroke="#334155" strokeOpacity={0.6} />
            <Tooltip content={<TooltipContent />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="value" radius={[5, 5, 1, 1]} isAnimationActive animationDuration={600}>
              {data.map((d, i) => (
                <Cell key={i} fill={pnlColor(d.value)} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Session legend row */}
      <div className="flex gap-4 mt-2 shrink-0 overflow-x-auto pb-0.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 shrink-0">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: pnlColor(d.value) }} />
            <span className="text-[11px] text-slate-500">{d.name}</span>
            <span className={cn("text-[11px] font-semibold", pnlTextCls(d.value))}>{fmtSigned(d.value, currency)}</span>
            <span className="text-[10px] text-slate-600">· {d.winRate}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'growth',  label: 'Дансны өсөлт',    icon: TrendingUp },
  { id: 'monthly', label: 'Сарын гүйцэтгэл', icon: BarChart2  },
  { id: 'pnl',     label: 'Ашиг/Алдагдал',  icon: PieIcon    },
  { id: 'session', label: 'Session',          icon: Globe      },
];

export function ChartWithTabs({ equityCurve = [], perfData = null, trades = [], currency = '$' }) {
  const [tab, setTab] = useState('growth');

  return (
    <div
      className="bg-slate-900 border border-slate-800/60 rounded-2xl flex flex-col transition-all duration-300"
      style={{ height: 400 }}
    >
      {/* Underline tabs */}
      <div className="flex border-b border-slate-800/60 px-4 shrink-0">
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-3 text-[12px] font-medium border-b-2 -mb-px transition-all duration-150 whitespace-nowrap',
                active
                  ? 'border-white text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'
              )}
            >
              <t.icon className="w-3.5 h-3.5 shrink-0" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Chart content */}
      <div className="flex-1 px-5 pb-4 pt-4 min-h-0 overflow-hidden">
        {tab === 'growth'  && <GrowthChart  equityCurve={equityCurve}       currency={currency} />}
        {tab === 'monthly' && <MonthlyChart byMonth={perfData?.byMonth}     currency={currency} />}
        {tab === 'pnl'     && <PnlChart     winLoss={perfData?.winLoss}     trades={trades}     />}
        {tab === 'session' && <SessionChart bySession={perfData?.bySession} currency={currency} />}
      </div>
    </div>
  );
}
