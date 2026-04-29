import { useState, useRef, useEffect } from "react";
import { Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useLang } from "@/contexts/LanguageContext";

const LS_RANGE = 'analytics_time_range';
const LS_CUSTOM = 'analytics_custom_range';

function getLast7Days() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  return { start, end };
}

export function TimeFilter({ value, onChange, customRange, onCustomRangeChange }) {
  const { t } = useLang();
  const filters = [
    { id: "1y",    label: t('filter1y') },
    { id: "6m",    label: t('filter6m') },
    { id: "3m",    label: t('filter3m') },
    { id: "1m",    label: t('filter1m') },
    { id: "7d",    label: t('filter7d') },
    { id: "today", label: t('filterToday') },
  ];
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    if (customRange?.startDate) return new Date(customRange.startDate);
    return getLast7Days().start;
  });
  const [endDate, setEndDate] = useState(() => {
    if (customRange?.endDate) return new Date(customRange.endDate);
    return getLast7Days().end;
  });
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRangeChange = (id) => {
    onChange(id);
    localStorage.setItem(LS_RANGE, id);
  };

  const handleOpenCustom = () => {
    // Load last saved custom range or default to last 7 days
    const saved = (() => { try { return JSON.parse(localStorage.getItem(LS_CUSTOM)); } catch { return null; } })();
    if (saved?.startDate) setStartDate(new Date(saved.startDate));
    else setStartDate(getLast7Days().start);
    if (saved?.endDate) setEndDate(new Date(saved.endDate));
    else setEndDate(getLast7Days().end);
    setIsOpen(!isOpen);
  };

  const handleDateChange = (dates) => {
    const [s, e] = dates;
    setStartDate(s);
    setEndDate(e);
  };

  const handleApply = () => {
    if (!startDate || !endDate) return;
    const range = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      start: startDate.toISOString().slice(0, 10),
      end: endDate.toISOString().slice(0, 10),
    };
    onCustomRangeChange(range);
    onChange('custom');
    localStorage.setItem(LS_RANGE, 'custom');
    localStorage.setItem(LS_CUSTOM, JSON.stringify(range));
    setIsOpen(false);
  };

  const handleClear = () => {
    setStartDate(getLast7Days().start);
    setEndDate(getLast7Days().end);
    onCustomRangeChange(null);
    onChange('all');
    localStorage.setItem(LS_RANGE, 'all');
    setIsOpen(false);
  };

  const customLabel = value === 'custom' && customRange?.start && customRange?.end
    ? `${customRange.start} – ${customRange.end}`
    : t('selectDateRange');

  return (
    <div className="relative flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
      {/* All — leftmost */}
      <button
        onClick={() => handleRangeChange('all')}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
          value === 'all' ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
        )}
      >
        {t('filterAll')}
      </button>

      <div className="w-px h-4 bg-slate-800 mx-0.5" />

      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => handleRangeChange(f.id)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
            value === f.id ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          )}
        >
          {f.label}
        </button>
      ))}

      <div className="w-px h-4 bg-slate-800 mx-0.5" />

      {/* Custom button — rightmost */}
      <button
        onClick={handleOpenCustom}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors",
          value === 'custom' || isOpen
            ? "bg-slate-800 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
        )}
      >
        <Calendar className="w-3.5 h-3.5" />
        {customLabel}
      </button>

      {/* Custom date picker popup */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">{t('selectDateRange')}</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <DatePicker
            selected={startDate}
            onChange={handleDateChange}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            inline
            calendarClassName="custom-range-picker"
          />

          {startDate && endDate && (
            <p className="text-xs text-slate-400 text-center mt-2">
              {startDate.toLocaleDateString('mn-MN')} – {endDate.toLocaleDateString('mn-MN')}
            </p>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleClear}
              className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {t('clear')}
            </button>
            <button
              onClick={handleApply}
              disabled={!startDate || !endDate}
              className="flex-1 px-3 py-2 bg-accent hover:bg-accent-hover text-slate-950 text-xs font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('apply')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
