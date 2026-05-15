import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Cell, PieChart, Pie,
} from "recharts";
import { useLang } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const MNT_RATE = 3450;
const fmtPnl = (v, cur) =>
  cur === '₮'
    ? `${v >= 0 ? '+' : ''}${Math.round(v * MNT_RATE).toLocaleString()} ₮`
    : `${v >= 0 ? '+' : ''}$${Math.abs(v).toFixed(2)}`;

const TT_STYLE = {
  backgroundColor: '#1e293b', borderColor: '#334155',
  borderRadius: '10px', color: '#f1f5f9', fontSize: 11,
};

// ── Tab 1: Equity curve ───────────────────────────────────────────────────────
function GrowthChart({ equityCurve, currency }) {
  if (!equityCurve?.length) return <EmptyChart />;
  const data = equityCurve.map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' }),
    value: d.equity,
  }));
  const last = data[data.length - 1]?.value ?? 0;
  const isUp = last >= 0;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isUp ? '#3b82f6' : '#f43f5e'} stopOpacity={0.25} />
            <stop offset="100%" stopColor={isUp ? '#3b82f6' : '#f43f5e'} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 6" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="label" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} dy={6} tick={{ fill: '#475569' }} />
        <YAxis
          stroke="#334155" fontSize={10} tickLine={false} axisLine={false} width={52}
          tickFormatter={v => currency === '₮' ? `${Math.round(v * MNT_RATE / 1000)}K₮` : `$${v}`}
          tick={{ fill: '#475569' }}
        />
        <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" />
        <Tooltip
          contentStyle={TT_STYLE}
          formatter={v => [fmtPnl(v, currency), 'Нийт']}
          labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
        />
        <Area type="monotone" dataKey="value" stroke={isUp ? '#3b82f6' : '#f43f5e'} strokeWidth={2}
          fill="url(#g1)" dot={false}
          activeDot={{ r: 4, fill: isUp ? '#3b82f6' : '#f43f5e', stroke: '#0f172a', strokeWidth: 2 }}
          isAnimationActive animationDuration={700}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Tab 2: Monthly returns ────────────────────────────────────────────────────
function MonthlyChart({ trades, currency, lang }) {
  const data = useMemo(() => {
    const map = {};
    trades.filter(t => t.status === 'CLOSED').forEach(t => {
      const d = t.exit_date || t.entry_date;
      if (!d) return;
      const key = d.slice(0, 7);
      if (!map[key]) map[key] = { month: key, pnl: 0, trades: 0 };
      map[key].pnl += parseFloat(t.pnl || 0);
      map[key].trades++;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).map(d => ({
      ...d,
      label: new Date(d.month + '-01').toLocaleDateString('mn-MN', { month: 'short', year: '2-digit' }),
    }));
  }, [trades]);

  if (!data.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 6" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="label" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} dy={6} tick={{ fill: '#475569' }} />
        <YAxis
          stroke="#334155" fontSize={10} tickLine={false} axisLine={false} width={52}
          tickFormatter={v => currency === '₮' ? `${Math.round(v * MNT_RATE / 1000)}K₮` : `$${v}`}
          tick={{ fill: '#475569' }}
        />
        <ReferenceLine y={0} stroke="#334155" />
        <Tooltip contentStyle={TT_STYLE} formatter={v => [fmtPnl(v, currency), 'P&L']} />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={600}>
          {data.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#10b981' : '#f43f5e'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Tab 3: Setup / Strategy stats ─────────────────────────────────────────────
function SetupChart({ trades, currency, lang }) {
  const data = useMemo(() => {
    const map = {};
    trades.filter(t => t.status === 'CLOSED').forEach(t => {
      const k = t.strategy || (lang === 'mn' ? 'Тодорхойгүй' : 'Unknown');
      if (!map[k]) map[k] = { name: k, pnl: 0, trades: 0, wins: 0 };
      map[k].pnl += parseFloat(t.pnl || 0);
      map[k].trades++;
      if (parseFloat(t.pnl) > 0) map[k].wins++;
    });
    return Object.values(map).sort((a, b) => b.trades - a.trades).slice(0, 8).map(d => ({
      ...d,
      winRate: d.trades > 0 ? Math.round(d.wins / d.trades * 100) : 0,
    }));
  }, [trades, lang]);

  if (!data.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" horizontal={false} />
        <XAxis type="number" stroke="#475569" fontSize={10} tickLine={false} axisLine={false}
          tickFormatter={v => currency === '₮' ? `${Math.round(v * MNT_RATE / 1000)}K₮` : `$${v}`} />
        <YAxis type="category" dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={90} tick={{ fill: '#94a3b8' }} />
        <Tooltip contentStyle={TT_STYLE} formatter={v => [fmtPnl(v, currency), 'P&L']} />
        <Bar dataKey="pnl" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={600}>
          {data.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#10b981' : '#f43f5e'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Tab 4: Win/Loss PnL distribution ─────────────────────────────────────────
function PnlChart({ trades, currency, lang }) {
  const { wins, losses, winTotal, lossTotal } = useMemo(() => {
    const closed = trades.filter(t => t.status === 'CLOSED');
    const wins = closed.filter(t => parseFloat(t.pnl) > 0);
    const losses = closed.filter(t => parseFloat(t.pnl) <= 0);
    return {
      wins, losses,
      winTotal: wins.reduce((s, t) => s + parseFloat(t.pnl || 0), 0),
      lossTotal: Math.abs(losses.reduce((s, t) => s + parseFloat(t.pnl || 0), 0)),
    };
  }, [trades]);

  if (!trades.filter(t => t.status === 'CLOSED').length) return <EmptyChart />;

  const donutData = [
    { name: lang === 'mn' ? 'Ялалт' : 'Wins', value: wins.length },
    { name: lang === 'mn' ? 'Ялагдал' : 'Losses', value: losses.length },
  ];
  const winRate = (wins.length + losses.length) > 0 ? Math.round(wins.length / (wins.length + losses.length) * 100) : 0;

  return (
    <div className="flex gap-6 h-full items-center">
      {/* Donut */}
      <div className="w-48 h-full relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={75}
              paddingAngle={3} dataKey="value" isAnimationActive animationDuration={700}>
              <Cell fill="#10b981" strokeWidth={0} />
              <Cell fill="#f43f5e" strokeWidth={0} />
            </Pie>
            <Tooltip contentStyle={TT_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{winRate}%</p>
            <p className="text-[10px] text-slate-500">{lang === 'mn' ? 'Ялалт' : 'Win Rate'}</p>
          </div>
        </div>
      </div>
      {/* Stats */}
      <div className="flex-1 space-y-3">
        {[
          { label: lang === 'mn' ? 'Нийт ялалт' : 'Total Wins', value: fmtPnl(winTotal, currency), cls: 'text-emerald-400', count: wins.length },
          { label: lang === 'mn' ? 'Нийт алдагдал' : 'Total Loss', value: fmtPnl(-lossTotal, currency), cls: 'text-rose-400', count: losses.length },
          { label: lang === 'mn' ? 'Дундаж ялалт' : 'Avg Win', value: fmtPnl(wins.length ? winTotal / wins.length : 0, currency), cls: 'text-emerald-400', count: null },
          { label: lang === 'mn' ? 'Дундаж алдагдал' : 'Avg Loss', value: fmtPnl(losses.length ? -lossTotal / losses.length : 0, currency), cls: 'text-rose-400', count: null },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/40 last:border-0">
            <div>
              <p className="text-xs text-slate-500">{item.label}</p>
              {item.count !== null && <p className="text-[11px] text-slate-600">{item.count} {lang === 'mn' ? 'арилжаа' : 'trades'}</p>}
            </div>
            <span className={`text-sm font-bold ${item.cls}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 5: Session stats ──────────────────────────────────────────────────────
function SessionChart({ trades, currency, lang }) {
  const data = useMemo(() => {
    const sessions = [
      { key: 'asian',    mn: 'Азийн', en: 'Asian',    hours: [0, 8] },
      { key: 'european', mn: 'Европын', en: 'European', hours: [8, 16] },
      { key: 'american', mn: 'Америкийн', en: 'American', hours: [16, 24] },
    ];
    const map = {};
    sessions.forEach(s => { map[s.key] = { name: lang === 'mn' ? s.mn : s.en, pnl: 0, trades: 0, wins: 0 }; });
    trades.filter(t => t.status === 'CLOSED').forEach(t => {
      const d = t.entry_date || t.exit_date;
      if (!d) return;
      const h = new Date(d).getUTCHours();
      const sess = h < 8 ? 'asian' : h < 16 ? 'european' : 'american';
      map[sess].pnl += parseFloat(t.pnl || 0);
      map[sess].trades++;
      if (parseFloat(t.pnl) > 0) map[sess].wins++;
    });
    return Object.values(map);
  }, [trades, lang]);

  if (data.every(d => d.trades === 0)) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 6" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="name" stroke="#334155" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
        <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} width={52}
          tickFormatter={v => currency === '₮' ? `${Math.round(v * MNT_RATE / 1000)}K₮` : `$${v}`}
          tick={{ fill: '#475569' }}
        />
        <ReferenceLine y={0} stroke="#334155" />
        <Tooltip contentStyle={TT_STYLE} formatter={v => [fmtPnl(v, currency), 'P&L']} />
        <Bar dataKey="pnl" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={600}>
          {data.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#10b981' : '#f43f5e'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart() {
  const { lang } = useLang();
  return (
    <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">
      {lang === 'mn' ? 'Өгөгдөл хангалтгүй' : 'Not enough data'}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function ChartWithTabs({ equityCurve = [], trades = [], currency = '$' }) {
  const { lang } = useLang();
  const [tab, setTab] = useState('growth');

  const TABS = [
    { id: 'growth',   mn: 'Өсөлт',            en: 'Growth' },
    { id: 'monthly',  mn: 'Сарын өгөөж',       en: 'Monthly' },
    { id: 'setup',    mn: 'Сетап статистик',   en: 'Setup Stats' },
    { id: 'pnl',      mn: 'Ашиг/Алдагдал',    en: 'P&L Stats' },
    { id: 'session',  mn: 'Сешн статистик',    en: 'Session' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-2xl flex flex-col hover:border-slate-700 transition-all duration-300" style={{ height: 360 }}>
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-slate-800/60 px-4 shrink-0 overflow-x-auto">
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
      <div className="flex-1 p-4 min-h-0">
        {tab === 'growth'  && <GrowthChart  equityCurve={equityCurve} currency={currency} />}
        {tab === 'monthly' && <MonthlyChart trades={trades} currency={currency} lang={lang} />}
        {tab === 'setup'   && <SetupChart   trades={trades} currency={currency} lang={lang} />}
        {tab === 'pnl'     && <PnlChart     trades={trades} currency={currency} lang={lang} />}
        {tab === 'session' && <SessionChart trades={trades} currency={currency} lang={lang} />}
      </div>
    </div>
  );
}
