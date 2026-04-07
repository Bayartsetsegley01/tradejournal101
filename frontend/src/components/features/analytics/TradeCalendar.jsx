import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function TradeCalendar({ trades = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар", "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар"];
  const dayNames = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

  const calendarDays = useMemo(() => {
    const days = [];
    // Empty slots for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toISOString().split('T')[0];
      
      // Find trades for this day
      const dayTrades = trades.filter(t => {
        if (!t.entry_date) return false;
        return t.entry_date.startsWith(dateStr);
      });

      let dayPnl = 0;
      let wins = 0;
      let losses = 0;
      
      dayTrades.forEach(t => {
        if (t.pnl) {
          dayPnl += parseFloat(t.pnl);
          if (parseFloat(t.pnl) > 0) wins++;
          else if (parseFloat(t.pnl) < 0) losses++;
        }
      });

      days.push({
        day: i,
        dateStr,
        trades: dayTrades.length,
        pnl: dayPnl,
        wins,
        losses
      });
    }
    return days;
  }, [currentDate, trades]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Арилжааны Календарь</h3>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-white min-w-[100px] text-center">
            {currentDate.getFullYear()} оны {monthNames[currentDate.getMonth()]}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((dayData, index) => {
          if (!dayData) {
            return <div key={`empty-${index}`} className="aspect-square rounded-xl bg-slate-950/30 border border-slate-800/30" />;
          }

          const isToday = new Date().toISOString().split('T')[0] === dayData.dateStr;
          const hasTrades = dayData.trades > 0;
          const isProfitable = dayData.pnl > 0;
          const isLoss = dayData.pnl < 0;

          return (
            <div 
              key={dayData.day} 
              className={`aspect-square rounded-xl p-2 flex flex-col transition-all relative group ${
                hasTrades 
                  ? isProfitable 
                    ? 'bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/50' 
                    : isLoss
                      ? 'bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/50'
                      : 'bg-slate-800 border border-slate-700 hover:border-slate-500'
                  : 'bg-slate-950/50 border border-slate-800/50 hover:border-slate-700'
              } ${isToday ? 'ring-2 ring-accent ring-offset-2 ring-offset-slate-900' : ''}`}
            >
              <span className={`text-xs font-medium ${hasTrades ? 'text-white' : 'text-slate-500'}`}>
                {dayData.day}
              </span>
              
              {hasTrades && (
                <div className="mt-auto flex flex-col gap-0.5">
                  <span className={`text-[10px] sm:text-xs font-bold truncate ${isProfitable ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-300'}`}>
                    {dayData.pnl > 0 ? '+' : ''}{dayData.pnl.toFixed(0)}$
                  </span>
                  <div className="flex gap-1">
                    {dayData.wins > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    {dayData.losses > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
                  </div>
                </div>
              )}

              {/* Tooltip */}
              {hasTrades && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                  <div className="font-semibold mb-1">{dayData.dateStr}</div>
                  <div className="text-slate-300">{dayData.trades} арилжаа</div>
                  <div className={isProfitable ? 'text-emerald-400' : 'text-rose-400'}>
                    P&L: {dayData.pnl > 0 ? '+' : ''}{dayData.pnl.toFixed(2)}$
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
