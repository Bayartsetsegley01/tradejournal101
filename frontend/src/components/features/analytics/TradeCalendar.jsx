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
    <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-base font-bold text-white w-52 text-center">
            {year} {MONTHS[month]}
          </h3>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={goToday}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
            isThisMonth
              ? "bg-accent/10 border-accent/30 text-accent cursor-default"
              : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
          }`}
        >
          {lang === "mn" ? "Энэ сар" : "This month"}
        </button>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {DAY_NAMES.map((d) => (
          <div key={d} className="flex justify-center">
            <span className="px-2 py-1 text-[11px] font-semibold text-slate-500 rounded-full border border-slate-800/60 bg-slate-800/30 w-full text-center">
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          const hasTrades = cell.count > 0;
          const isProfit = hasTrades && cell.pnl > 0;
          const isLoss = hasTrades && cell.pnl < 0;

          const bg = !cell.current
            ? "bg-slate-800/20 border-slate-800/20"
            : hasTrades
            ? isProfit
              ? "bg-blue-500/10 border-blue-500/25 hover:border-blue-500/50"
              : isLoss
              ? "bg-rose-500/10 border-rose-500/25 hover:border-rose-500/50"
              : "bg-slate-800/40 border-slate-700/40"
            : "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50";

          return (
            <div
              key={idx}
              className={`aspect-square rounded-xl border flex flex-col relative group cursor-default transition-all duration-150 p-1.5 ${bg} ${
                isToday ? "ring-2 ring-accent/70 ring-offset-1 ring-offset-slate-900" : ""
              }`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                {hasTrades && cell.current ? (
                  <Calendar
                    className={`w-2.5 h-2.5 mt-0.5 shrink-0 ${
                      isProfit ? "text-blue-400/60" : "text-rose-400/60"
                    }`}
                  />
                ) : (
                  <span />
                )}
                <span
                  className={`text-[10px] font-semibold leading-none ${
                    !cell.current
                      ? "text-slate-700"
                      : isToday
                      ? "text-accent"
                      : hasTrades
                      ? "text-slate-300"
                      : "text-slate-500"
                  }`}
                >
                  {cell.day}
                </span>
              </div>

              {/* PnL + trade count */}
              {hasTrades && cell.current && (
                <div className="mt-auto flex flex-col items-center gap-0.5">
                  <span
                    className={`text-[11px] font-bold leading-none ${
                      isProfit ? "text-blue-400" : "text-rose-400"
                    }`}
                  >
                    {isLoss ? "–" : ""}${Math.abs(cell.pnl).toFixed(0)}
                  </span>
                  <span
                    className={`text-[8px] font-semibold uppercase tracking-wide leading-none ${
                      isProfit ? "text-blue-400/50" : "text-rose-400/50"
                    }`}
                  >
                    {cell.count} {lang === "mn" ? "арилжаа" : `trade${cell.count !== 1 ? "s" : ""}`}
                  </span>
                </div>
              )}

              {/* Dot */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                <div
                  className={`w-1 h-1 rounded-full ${
                    hasTrades && cell.current
                      ? isProfit
                        ? "bg-blue-400"
                        : "bg-rose-400"
                      : "bg-slate-700/40"
                  }`}
                />
              </div>

              {/* Tooltip */}
              {hasTrades && cell.current && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[160px] bg-slate-800 border border-slate-700 rounded-xl p-2.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 shadow-2xl pointer-events-none">
                  <p className="text-[10px] text-slate-400 mb-1 font-medium">{cell.dateStr}</p>
                  <p className="text-[11px] text-slate-300">
                    {cell.count} {lang === "mn" ? "арилжаа" : `trade${cell.count !== 1 ? "s" : ""}`}
                  </p>
                  <p className={`text-[11px] font-bold mt-0.5 ${isProfit ? "text-blue-400" : "text-rose-400"}`}>
                    P&L: {isProfit ? "+" : ""}${cell.pnl.toFixed(2)}
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
