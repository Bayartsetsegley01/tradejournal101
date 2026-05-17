import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Cell, PieChart, Pie,
} from "recharts";
import { useLang } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const MNT_RATE = 3450;
const fmt = (v, cur) =>
  cur === '₮'
    ? `${v >= 0 ? '' : '-'}${Math.round(Math.abs(v) * MNT_RATE).toLocaleString()}₮`
    : `${v >= 0 ? '' : '-'}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const TT = { backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 10, color: '#f1f5f9', fontSize: 11 };

function EmptyChart() {
  const { lang } = useLang();
  return (
    <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">
      {lang === 'mn' ? 'Өгөгдөл хангалтгүй' : 'Not enough data'}
    </div>
  );
}

// ── Tab 1: Growth ─────────────────────────────────────────────────────────────
function GrowthChart({ equityCurve, currency }) {
  if (!equityCurve?.length) return <EmptyChart />;
  const data = equityCurve.map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-CA', { month: '2-digit', day: '2-digit' }).replace('/', '-'),
    value: d.equity,
  }));
  const last = data[data.length - 1]?.value ?? 0;
  const isUp = last >= 0;
  const color = isUp ? '#3b82f6' : '#f43f5e';
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="grad_growth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 6" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="label" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} dy={6} tick={{ fill: '#475569' }} interval="preserveStartEnd" />
        <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} width={56}
          tickFormatter={v => currency === '₮' ? `${Math.round(v * MNT_RATE / 1000)}K₮` : `$${v.toLocaleString()}`}
          tick={{ fill: '#475569' }} />
        <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" />
        <Tooltip contentStyle={TT}
          formatter={v => [fmt(v, currency), 'Нийт өсөлт']}
          labelStyle={{ color: '#94a3b8', marginBottom: 4 }} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
          fill="url(#grad_growth)" dot={false}
          activeDot={{ r: 4, fill: color, stroke: '#0f172a', strokeWidth: 2 }}
          isAnimationActive animationDuration={700} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Tab 2: Monthly returns ────────────────────────────────────────────────────
function MonthlyChart({ byMonth, currency }) {
  if (!byMonth?.length) return <EmptyChart />;
  const data = byMonth.map(d => ({ ...d, label: d.month }));
  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 6" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="label" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} dy={6} tick={{ fill: '#475569' }} />
            <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} width={52}
              tickFormatter={v => currency === '₮' ? `${Math.round(v * MNT_RATE / 1000)}K₮` : `$${v}`}
              tick={{ fill: '#475569' }} />
            <ReferenceLine y={0} stroke="#334155" />
            <Tooltip contentStyle={TT} formatter={v => [fmt(v, currency), 'P&L']} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={600}>
              {data.map((d, i) => <Cell key={i} fill="#3b82f6" />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="w-44 shrink-0 flex flex-col gap-2 overflow-y-auto">
        {data.map((d, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 shrink-0">
            <p className="text-[11px] text-slate-400 font-medium mb-1">{d.month}</p>
            <p className="text-[11px] text-slate-500">{d.trades} АРИЛЖАА</p>
            <p className="text-base font-bold text-blue-400 mt-0.5">{fmt(d.value, currency)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 3: Setup stats ────────────────────────────────────────────────────────
function SetupChart({ byStrategy, currency }) {
  if (!byStrategy?.length) return <EmptyChart />;
  const data = byStrategy.slice(0, 8);
  const maxPnl = Math.max(...data.map(d => Math.abs(d.pnl)));
  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" horizontal={false} />
            <XAxis type="number" stroke="#475569" fontSize={10} tickLine={false} axisLine={false}
              tickFormatter={v => currency === '₮' ? `${Math.round(v * MNT_RATE / 1000)}K₮` : `$${v}`} />
            <YAxis type="category" dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false}
              width={100} tick={{ fill: '#94a3b8' }} />
            <Tooltip contentStyle={TT}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ ...TT, padding: '8px 12px' }}>
                    <p className="font-bold text-white uppercase text-[11px] mb-1">{d.name}</p>
                    <p className="text-blue-400 font-bold text-sm">{fmt(d.pnl, currency)}</p>
                    <p className="text-slate-400 text-[11px] mt-1">{d.trades} АРИЛЖАА &nbsp; WR: <span className="text-white">{d.winRate}%</span></p>
                  </div>
                );
              }}
            />
            <Bar dataKey="pnl" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={600}>
              {data.map((d, i) => <Cell key={i} fill="#3b82f6" />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="w-44 shrink-0 flex flex-col gap-2 overflow-y-auto">
        {data.map((d, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 shrink-0">
            <p className="text-[11px] text-slate-200 font-semibold leading-tight mb-1 truncate">{d.name}</p>
            <p className="text-base font-bold text-blue-400">{fmt(d.pnl, currency)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {d.trades} АРИЛЖАА &nbsp;
              <span className="text-rose-400">WR: {d.winRate}%</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 4: Win/Loss donut ─────────────────────────────────────────────────────
function PnlChart({ winLoss }) {
  if (!winLoss?.length) return <EmptyChart />;
  const wins = winLoss.find(d => d.name === 'Ялалт')?.value ?? 0;
  const losses = winLoss.find(d => d.name === 'Ялагдал')?.value ?? 0;
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const donutData = [
    { name: 'Ялалт', value: wins },
    { name: 'Ялагдал', value: losses },
  ];
  return (
    <div className="flex gap-6 h-full items-center">
      <div className="relative shrink-0" style={{ width: 180, height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={82}
              paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}
              isAnimationActive animationDuration={700}>
              <Cell fill="#3b82f6" strokeWidth={0} />
              <Cell fill="#f43f5e" strokeWidth={0} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-sm bg-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-white">{wins} АШИГТАЙ</p>
            <p className="text-sm text-slate-400">{total > 0 ? ((wins / total) * 100).toFixed(1) : 0}%</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-sm bg-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-white">{losses} АЛДАГДАЛТАЙ</p>
            <p className="text-sm text-slate-400">{total > 0 ? ((losses / total) * 100).toFixed(1) : 0}%</p>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">НИЙТ ЯЛАЛТ (WIN RATE)</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{winRate}%</p>
        </div>
      </div>
    </div>
  );
}

// ── Tab 5: Session stats ──────────────────────────────────────────────────────
function SessionChart({ bySession, currency }) {
  if (!bySession?.length) return <EmptyChart />;
  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bySession} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 6" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" stroke="#334155" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
            <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} width={52}
              tickFormatter={v => currency === '₮' ? `${Math.round(v * MNT_RATE / 1000)}K₮` : `$${v}`}
              tick={{ fill: '#475569' }} />
            <ReferenceLine y={0} stroke="#334155" />
            <Tooltip contentStyle={TT} formatter={v => [fmt(v, currency), 'P&L']} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={600}>
              {bySession.map((d, i) => <Cell key={i} fill={d.value >= 0 ? '#3b82f6' : '#f43f5e'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="w-44 shrink-0 flex flex-col gap-2 overflow-y-auto">
        {bySession.map((d, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 shrink-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[11px] text-slate-200 font-semibold">{d.name}</p>
              <p className={cn("text-sm font-bold", d.value >= 0 ? "text-blue-400" : "text-rose-400")}>
                {fmt(d.value, currency)}
              </p>
            </div>
            <p className="text-[11px] text-slate-500">
              {d.trades} АРИЛЖАА &nbsp;
              <span className={d.winRate >= 50 ? "text-blue-400" : "text-rose-400"}>WR: {d.winRate}%</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function ChartWithTabs({ equityCurve = [], perfData = null, currency = '$' }) {
  const { lang } = useLang();
  const [tab, setTab] = useState('growth');

  const TABS = [
    { id: 'growth',   mn: 'Өсөлт',            en: 'Growth' },
    { id: 'monthly',  mn: 'Сарын өгөөж',       en: 'Monthly' },
    { id: 'setup',    mn: 'Сетап статистик',   en: 'Setup Stats' },
    { id: 'pnl',      mn: 'Ашиг/Алдагдал',    en: 'P&L' },
    { id: 'session',  mn: 'Сешн статистик',    en: 'Session' },
  ];

  const LABEL = {
    growth:  lang === 'mn' ? 'Нийт дансны өсөлт' : 'Total account growth',
    monthly: lang === 'mn' ? 'Сарын өгөөжийн задаргаа' : 'Monthly return breakdown',
    setup:   lang === 'mn' ? 'Сетапаар задаргаа' : 'Setup breakdown',
    pnl:     lang === 'mn' ? 'Ашиг/Алдагдалын харьцаа' : 'Profit / Loss ratio',
    session: lang === 'mn' ? 'Сешнээр задаргаа' : 'Session breakdown',
  };

  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-2xl flex flex-col hover:border-slate-700 transition-all duration-300" style={{ height: 360 }}>
      {/* Tab bar */}
      <div className="flex items-center border-b border-slate-800/60 px-4 shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-all duration-150 -mb-px',
              tab === t.id
                ? 'border-accent text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            )}
          >
            {lang === 'mn' ? t.mn : t.en}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="flex-1 px-4 pb-4 pt-3 min-h-0 overflow-hidden">
        {tab === 'growth'  && <GrowthChart  equityCurve={equityCurve} currency={currency} />}
        {tab === 'monthly' && <MonthlyChart byMonth={perfData?.byMonth} currency={currency} />}
        {tab === 'setup'   && <SetupChart   byStrategy={perfData?.byStrategy} currency={currency} />}
        {tab === 'pnl'     && <PnlChart     winLoss={perfData?.winLoss} />}
        {tab === 'session' && <SessionChart bySession={perfData?.bySession} currency={currency} />}
      </div>
    </div>
  );
}
