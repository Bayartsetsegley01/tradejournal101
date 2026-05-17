import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

const MN_MONTHS = [
  "Нэгдүгээр сар","Хоёрдугаар сар","Гуравдугаар сар","Дөрөвдүгээр сар",
  "Тавдугаар сар","Зургаадугаар сар","Долдугаар сар","Наймдугаар сар",
  "Есдүгээр сар","Аравдугаар сар","Арван нэгдүгээр сар","Арван хоёрдугаар сар",
];
const EN_MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const MN_DAYS = ["Дав","Мяг","Лха","Пүр","Баа","Бям","Ням"];
const EN_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export function TradeCalendar({ trades = [] }) {
  const { lang } = useLang();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const MONTHS = lang === "mn" ? MN_MONTHS : EN_MONTHS;
  const DAY_NAMES = lang === "mn" ? MN_DAYS : EN_DAYS;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const now = new Date();
  const isThisMonth = now.getFullYear() === year && now.getMonth() === month;
  const todayStr = now.toISOString().split("T")[0];

  const tradeMap = useMemo(() => {
    const map = {};
    trades.forEach((t) => {
      const d = t.entry_date?.slice(0, 10);
      if (!d) return;
      if (!map[d]) map[d] = { pnl: 0, count: 0, wins: 0, losses: 0 };
      const p = parseFloat(t.pnl);
      if (!isNaN(p)) {
        map[d].pnl += p;
        map[d].count += 1;
        if (p > 0) map[d].wins += 1;
        else if (p < 0) map[d].losses += 1;
      }
    });
    return map;
  }, [trades]);

  const calendarDays = useMemo(() => {
    const rawFirst = new Date(year, month, 1).getDay();
    const firstDay = (rawFirst + 6) % 7; // Mon = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const days = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      const dateStr = new Date(year, month - 1, d).toISOString().split("T")[0];
      days.push({ day: d, dateStr, current: false, ...tradeMap[dateStr] });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = new Date(year, month, i).toISOString().split("T")[0];
      days.push({ day: i, dateStr, current: true, ...tradeMap[dateStr] });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const dateStr = new Date(year, month + 1, i).toISOString().split("T")[0];
      days.push({ day: i, dateStr, current: false, ...tradeMap[dateStr] });
    }

    return days;
  }, [year, month, tradeMap]);

  const summary = useMemo(() => {
    const active = calendarDays.filter((d) => d.current && d.count > 0);
    return {
      totalTrades: active.reduce((s, d) => s + d.count, 0),
      totalPnl: active.reduce((s, d) => s + d.pnl, 0),
      winDays: active.filter((d) => d.pnl > 0).length,
      lossDays: active.filter((d) => d.pnl < 0).length,
    };
  }, [calendarDays]);

  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700 transition-all duration-300 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <h3 className="text-sm font-bold text-white w-48 text-center">
            {year} {MONTHS[month]}
          </h3>
          <button
            onClick={nextMonth}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="flex justify-center">
            <span className="text-[10px] font-semibold text-slate-600 w-full text-center py-1">
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* Day cells — fixed compact height */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          const hasTrades = cell.count > 0;
          const isProfit = hasTrades && cell.pnl > 0;
          const isLoss = hasTrades && cell.pnl < 0;

          const bg = !cell.current
            ? "bg-slate-800/10 border-slate-800/10"
            : hasTrades
            ? isProfit
              ? "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40"
              : isLoss
              ? "bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40"
              : "bg-slate-800/30 border-slate-700/30"
            : "bg-slate-800/20 border-slate-700/20 hover:bg-slate-800/40";

          return (
            <div
              key={idx}
              className={`aspect-square rounded-lg border flex flex-col relative group cursor-default transition-all duration-150 p-1 ${bg} ${
                isToday ? "ring-2 ring-accent/60 ring-offset-1 ring-offset-slate-900" : ""
              }`}
            >
              {/* Day number */}
              <span
                className={`text-[10px] font-semibold leading-none self-end ${
                  !cell.current
                    ? "text-slate-800"
                    : isToday
                    ? "text-accent"
                    : hasTrades
                    ? "text-slate-300"
                    : "text-slate-600"
                }`}
              >
                {cell.day}
              </span>

              {/* PnL */}
              {hasTrades && cell.current && (
                <div className="mt-auto flex flex-col items-center gap-0.5">
                  <span
                    className={`text-[10px] font-bold leading-none ${
                      isProfit ? "text-blue-400" : "text-rose-400"
                    }`}
                  >
                    {isLoss ? "–" : "+"}${Math.abs(cell.pnl).toFixed(0)}
                  </span>
                  <span
                    className={`text-[8px] font-medium leading-none ${
                      isProfit ? "text-blue-400/50" : "text-rose-400/50"
                    }`}
                  >
                    {cell.count}т
                  </span>
                </div>
              )}

              {/* Dot indicator */}
              {hasTrades && cell.current && (
                <div className="absolute top-1 left-1">
                  <div className={`w-1 h-1 rounded-full ${isProfit ? "bg-blue-400" : "bg-rose-400"}`} />
                </div>
              )}

              {/* Tooltip */}
              {hasTrades && cell.current && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[140px] bg-slate-800 border border-slate-700 rounded-xl p-2.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 shadow-2xl pointer-events-none">
                  <p className="text-[10px] text-slate-400 mb-1 font-medium">{cell.dateStr}</p>
                  <p className="text-[11px] text-slate-300">{cell.count} арилжаа</p>
                  <p className={`text-[11px] font-bold mt-0.5 ${isProfit ? "text-blue-400" : "text-rose-400"}`}>
                    {isProfit ? "+" : ""}${cell.pnl.toFixed(2)}
                  </p>
                  {(cell.wins > 0 || cell.losses > 0) && (
                    <p className="text-[10px] text-slate-500 mt-0.5">{cell.wins}W / {cell.losses}L</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Monthly summary */}
      <div className="mt-4 pt-4 border-t border-slate-800/60">
        {summary.totalTrades > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: lang === "mn" ? "Арилжаа" : "Trades", value: summary.totalTrades, cls: "text-white" },
              {
                label: "Net P&L",
                value: `${summary.totalPnl >= 0 ? "+" : ""}$${summary.totalPnl.toFixed(0)}`,
                cls: summary.totalPnl >= 0 ? "text-blue-400" : "text-rose-400",
              },
              { label: lang === "mn" ? "Ашигтай өдөр" : "Win Days", value: summary.winDays, cls: "text-blue-400" },
              { label: lang === "mn" ? "Алдагдалтай өдөр" : "Loss Days", value: summary.lossDays, cls: "text-rose-400" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-[10px] text-slate-500 mb-0.5 font-medium">{item.label}</p>
                <p className={`text-sm font-bold ${item.cls}`}>{item.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-600 text-center py-1">
            {lang === "mn" ? "Энэ сард арилжаа алга" : "No trades this month"}
          </p>
        )}
      </div>
    </div>
  );
}
