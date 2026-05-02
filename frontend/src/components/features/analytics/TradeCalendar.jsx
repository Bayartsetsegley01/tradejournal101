import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export function TradeCalendar({ trades = [] }) {
  const { t } = useLang();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = new Date(year, month, i).toISOString().split('T')[0];
      const dayTrades = trades.filter(t => t.entry_date?.startsWith(dateStr));
      let dayPnl = 0, wins = 0, losses = 0;
      dayTrades.forEach(t => {
        const p = parseFloat(t.pnl);
        if (!isNaN(p)) { dayPnl += p; if (p > 0) wins++; else if (p < 0) losses++; }
      });
      days.push({ day: i, dateStr, trades: dayTrades.length, pnl: dayPnl, wins, losses });
    }
    return days;
  }, [currentDate, trades, firstDay, daysInMonth, year, month]);

  const monthlySummary = useMemo(() => {
    const valid = calendarDays.filter(Boolean).filter(d => d.trades > 0);
    return {
      totalTrades: valid.reduce((s, d) => s + d.trades, 0),
      totalPnl: valid.reduce((s, d) => s + d.pnl, 0),
      tradingDays: valid.length,
      winDays: valid.filter(d => d.pnl > 0).length,
      lossDays: valid.filter(d => d.pnl < 0).length,
    };
  }, [calendarDays]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-accent/20 transition-colors duration-300">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-white">Trade Calendar</h3>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-white min-w-[130px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DAY_NAMES.map(day => (
          <div key={day} className="text-center text-[11px] font-medium text-slate-500 py-1.5">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((dayData, index) => {
          if (!dayData) {
            return <div key={`empty-${index}`} className="aspect-square rounded-xl bg-slate-950/20" />;
          }

          const isToday = new Date().toISOString().split('T')[0] === dayData.dateStr;
          const { trades: tradeCount, pnl, wins, losses } = dayData;
          const hasTrades = tradeCount > 0;
          const isProfitable = pnl > 0;
          const isLoss = pnl < 0;

          const intensity = hasTrades ? Math.min(Math.abs(pnl) / 100, 1) : 0;

          return (
            <div
              key={dayData.day}
              className={`aspect-square rounded-xl p-1.5 flex flex-col transition-all duration-200 relative group cursor-default ${
                hasTrades
                  ? isProfitable
                    ? 'border hover:border-emerald-500/60 hover:shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                    : isLoss
                      ? 'border hover:border-rose-500/60 hover:shadow-[0_0_10px_rgba(244,63,94,0.15)]'
                      : 'bg-slate-800 border border-slate-700'
                  : 'bg-slate-950/30 border border-slate-800/30 hover:border-slate-700/50'
              } ${isToday ? 'ring-2 ring-accent ring-offset-1 ring-offset-slate-900' : ''}`}
              style={hasTrades ? {
                backgroundColor: isProfitable
                  ? `rgba(16,185,129,${0.05 + intensity * 0.2})`
                  : isLoss
                    ? `rgba(244,63,94,${0.05 + intensity * 0.2})`
                    : undefined,
                borderColor: isProfitable
                  ? `rgba(16,185,129,${0.2 + intensity * 0.3})`
                  : isLoss
                    ? `rgba(244,63,94,${0.2 + intensity * 0.3})`
                    : undefined,
              } : undefined}
            >
              <span className={`text-[10px] font-medium leading-none ${hasTrades ? 'text-white' : 'text-slate-600'}`}>
                {dayData.day}
              </span>

              {hasTrades && (
                <div className="mt-auto flex flex-col gap-0.5">
                  <span className={`text-[9px] font-bold truncate leading-none ${isProfitable ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-300'}`}>
                    {pnl > 0 ? '+' : ''}{pnl.toFixed(0)}
                  </span>
                  <div className="flex gap-0.5">
                    {wins > 0 && <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />}
                    {losses > 0 && <span className="w-1 h-1 rounded-full bg-rose-400 shrink-0" />}
                  </div>
                </div>
              )}

              {hasTrades && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[160px] bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-2.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-2xl pointer-events-none">
                  <div className="font-semibold mb-1 text-slate-300">{dayData.dateStr}</div>
                  <div className="text-slate-400">{tradeCount} trade{tradeCount !== 1 ? 's' : ''}</div>
                  <div className={`font-bold mt-0.5 ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                    P&L: {pnl > 0 ? '+' : ''}${pnl.toFixed(2)}
                  </div>
                  {(wins > 0 || losses > 0) && (
                    <div className="text-slate-500 mt-0.5">{wins}W / {losses}L</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Monthly Summary */}
      {monthlySummary.totalTrades > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-0.5">Trades</p>
            <p className="text-sm font-bold text-white">{monthlySummary.totalTrades}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-0.5">Net P&L</p>
            <p className={`text-sm font-bold ${monthlySummary.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {monthlySummary.totalPnl >= 0 ? '+' : ''}${monthlySummary.totalPnl.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-0.5">Win Days</p>
            <p className="text-sm font-bold text-emerald-400">{monthlySummary.winDays}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-0.5">Loss Days</p>
            <p className="text-sm font-bold text-rose-400">{monthlySummary.lossDays}</p>
          </div>
        </div>
      )}
    </div>
  );
}
