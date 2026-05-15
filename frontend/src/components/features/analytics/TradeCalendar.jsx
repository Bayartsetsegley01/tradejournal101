import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

const MN_MONTHS = ["1-р сар","2-р сар","3-р сар","4-р сар","5-р сар","6-р сар","7-р сар","8-р сар","9-р сар","10-р сар","11-р сар","12-р сар"];
const EN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MN_DAYS = ["Да","Мя","Лх","Пү","Ба","Бя","Ня"];
const EN_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MNT_RATE = 3450;

const GRID = 'repeat(7, 1fr) 76px';

function fmtPnl(v, currency) {
  const abs = Math.abs(v);
  if (currency === '₮') return `${v >= 0 ? '+' : '-'}${Math.round(abs * MNT_RATE).toLocaleString()}₮`;
  return `${v >= 0 ? '+' : '-'}$${abs.toFixed(0)}`;
}

export function TradeCalendar({ trades = [], currency = '$' }) {
  const { lang } = useLang();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const MONTHS   = lang === 'mn' ? MN_MONTHS : EN_MONTHS;
  const DAY_NAMES = lang === 'mn' ? MN_DAYS : EN_DAYS;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = (new Date(year, month, 1).getDay() + 6) % 7; // Mon = 0

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = new Date(year, month, i).toISOString().split('T')[0];
      const closed = trades.filter(
        t => t.status === 'CLOSED' && (t.exit_date?.startsWith(dateStr) || t.entry_date?.startsWith(dateStr))
      );
      let pnl = 0, wins = 0, losses = 0;
      closed.forEach(t => {
        const p = parseFloat(t.pnl);
        if (!isNaN(p)) { pnl += p; if (p > 0) wins++; else if (p < 0) losses++; }
      });
      days.push({ day: i, dateStr, trades: closed.length, pnl, wins, losses });
    }
    return days;
  }, [year, month, firstDay, daysInMonth, trades]);

  // Group into weeks of 7, pad end to multiple of 7
  const weeks = useMemo(() => {
    const padded = [...calendarDays];
    while (padded.length % 7 !== 0) padded.push(null);
    const result = [];
    for (let i = 0; i < padded.length; i += 7) {
      const days = padded.slice(i, i + 7);
      const active = days.filter(Boolean);
      const weekTrades = active.reduce((s, d) => s + d.trades, 0);
      const weekPnl    = active.reduce((s, d) => s + d.pnl, 0);
      result.push({ days, weekTrades, weekPnl });
    }
    return result;
  }, [calendarDays]);

  const monthlySummary = useMemo(() => {
    const active = calendarDays.filter(Boolean).filter(d => d.trades > 0);
    return {
      totalTrades: active.reduce((s, d) => s + d.trades, 0),
      totalPnl:    active.reduce((s, d) => s + d.pnl, 0),
      winDays:     active.filter(d => d.pnl > 0).length,
      lossDays:    active.filter(d => d.pnl < 0).length,
    };
  }, [calendarDays]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-white">
            {lang === 'mn' ? 'Арилжааны календар' : 'Trade Calendar'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-semibold text-white min-w-[100px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Day name headers */}
      <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: GRID }}>
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-slate-600 py-1">{d}</div>
        ))}
        <div className="text-center text-[10px] font-semibold text-slate-600 py-1 px-1">
          {lang === 'mn' ? '7 хоног' : 'Week'}
        </div>
      </div>

      {/* Week rows – full month grid */}
      <div className="space-y-1">
        {weeks.map((week, wi) => {
            const weekIsProfit = week.weekPnl >= 0;
            return (
              <div key={wi} className="grid gap-1 items-stretch" style={{ gridTemplateColumns: GRID }}>
                {week.days.map((dayData, di) => {
                  if (!dayData) return <div key={`e-${di}`} />;

                  const isToday  = todayStr === dayData.dateStr;
                  const hasTrades = dayData.trades > 0;
                  const isProfit  = dayData.pnl > 0;
                  const isLoss    = dayData.pnl < 0;
                  const intensity = hasTrades ? Math.min(Math.abs(dayData.pnl) / 80, 1) : 0;

                  return (
                    <div
                      key={dayData.day}
                      className={`aspect-square rounded-xl p-1.5 flex flex-col relative group cursor-default transition-all duration-150 ${
                        isToday ? 'ring-2 ring-accent/70 ring-offset-1 ring-offset-slate-900' : ''
                      } ${!hasTrades ? 'hover:bg-slate-800/40' : ''}`}
                      style={hasTrades ? {
                        backgroundColor: isProfit
                          ? `rgba(16,185,129,${0.06 + intensity * 0.18})`
                          : isLoss ? `rgba(244,63,94,${0.06 + intensity * 0.18})` : undefined,
                        border: isProfit
                          ? `1px solid rgba(16,185,129,${0.15 + intensity * 0.25})`
                          : isLoss ? `1px solid rgba(244,63,94,${0.15 + intensity * 0.25})` : undefined,
                      } : undefined}
                    >
                      <span className={`text-[10px] font-semibold leading-none ${
                        isToday ? 'text-accent' : hasTrades ? 'text-white' : 'text-slate-600'
                      }`}>
                        {dayData.day}
                      </span>
                      {hasTrades && (
                        <div className="mt-auto">
                          <span className={`text-[9px] font-bold leading-none block truncate ${
                            isProfit ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            {dayData.pnl >= 0 ? '+' : ''}{dayData.pnl.toFixed(0)}
                          </span>
                        </div>
                      )}

                      {/* Hover tooltip */}
                      {hasTrades && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] bg-slate-800 border border-slate-700 rounded-xl p-2.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 shadow-2xl pointer-events-none text-xs">
                          <p className="text-slate-400 mb-1 font-medium">{dayData.dateStr}</p>
                          <p className="text-slate-300">
                            {dayData.trades} {lang === 'mn' ? 'арилжаа' : `trade${dayData.trades !== 1 ? 's' : ''}`}
                          </p>
                          <p className={`font-bold mt-0.5 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            P&L: {dayData.pnl >= 0 ? '+' : ''}${dayData.pnl.toFixed(2)}
                          </p>
                          {(dayData.wins > 0 || dayData.losses > 0) && (
                            <p className="text-slate-500 mt-0.5">{dayData.wins}W / {dayData.losses}L</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Weekly summary column */}
                {week.weekTrades > 0 ? (
                  <div className={`rounded-xl flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 ${
                    weekIsProfit
                      ? 'bg-emerald-500/8 border border-emerald-500/15'
                      : 'bg-rose-500/8 border border-rose-500/15'
                  }`}>
                    <span className="text-[9px] text-slate-500 font-medium">
                      {week.weekTrades}{lang === 'mn' ? 'т' : 'tr'}
                    </span>
                    <span className={`text-[10px] font-bold leading-none text-center ${
                      weekIsProfit ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {fmtPnl(week.weekPnl, currency)}
                    </span>
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-800/20 border border-slate-800/40" />
                )}
              </div>
            );
          })}
        </div>

      {/* Monthly footer */}
      {monthlySummary.totalTrades > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-4 gap-2">
          {[
            { label: lang === 'mn' ? 'Арилжаа' : 'Trades',     value: monthlySummary.totalTrades,                       cls: 'text-white' },
            { label: 'Net P&L',                                  value: fmtPnl(monthlySummary.totalPnl, currency),        cls: monthlySummary.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400' },
            { label: lang === 'mn' ? 'Ашигтай өдөр' : 'Win Days', value: monthlySummary.winDays,                         cls: 'text-emerald-400' },
            { label: lang === 'mn' ? 'Алдагдалтай' : 'Loss Days', value: monthlySummary.lossDays,                        cls: 'text-rose-400' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <p className="text-[10px] text-slate-500 mb-0.5 font-medium">{item.label}</p>
              <p className={`text-sm font-bold ${item.cls}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
