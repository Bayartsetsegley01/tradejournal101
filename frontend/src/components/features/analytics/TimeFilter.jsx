import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const LS_RANGE = 'analytics_time_range';
const LS_CUSTOM = 'analytics_custom_range';

function getLast7Days() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  return { start, end };
}

const OPTIONS = [
  { id: 'all',    label: 'Бүгд' },
  { id: '1y',     label: '1 жил' },
  { id: '6m',     label: '6 сар' },
  { id: '3m',     label: '3 сар' },
  { id: '1m',     label: '1 сар' },
  { id: '7d',     label: '7 хоног' },
  { id: 'today',  label: 'Өнөөдөр' },
  { id: 'custom', label: 'Хугацаа сонгох', icon: Calendar },
];

export function TimeFilter({ value, onChange, customRange, onCustomRangeChange }) {
  const [open, setOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    if (customRange?.startDate) return new Date(customRange.startDate);
    return getLast7Days().start;
  });
  const [endDate, setEndDate] = useState(() => {
    if (customRange?.endDate) return new Date(customRange.endDate);
    return getLast7Days().end;
  });

  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedOption = OPTIONS.find(o => o.id === value) ?? OPTIONS[0];

  const handleSelect = (id) => {
    if (id === 'custom') {
      const saved = (() => { try { return JSON.parse(localStorage.getItem(LS_CUSTOM)); } catch { return null; } })();
      if (saved?.startDate) setStartDate(new Date(saved.startDate));
      else setStartDate(getLast7Days().start);
      if (saved?.endDate) setEndDate(new Date(saved.endDate));
      else setEndDate(getLast7Days().end);
      setShowPicker(true);
      return;
    }
    setShowPicker(false);
    onChange(id);
    localStorage.setItem(LS_RANGE, id);
    setOpen(false);
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
    setOpen(false);
    setShowPicker(false);
  };

  const customLabel = value === 'custom' && customRange?.start && customRange?.end
    ? `${customRange.start} – ${customRange.end}`
    : 'Хугацаа сонгох';

  const displayLabel = value === 'custom' ? customLabel : selectedOption.label;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(p => !p); setShowPicker(false); }}
        className={cn(
          "flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all",
          open
            ? "bg-slate-800 border-slate-600 text-white"
            : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white"
        )}
      >
        <span className="max-w-[160px] truncate">{displayLabel}</span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="py-1.5">
            {OPTIONS.map((opt, i) => {
              const isSelected = value === opt.id;
              const isCustom = opt.id === 'custom';
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left",
                    isSelected
                      ? "text-white bg-slate-800/60"
                      : "text-slate-300 hover:bg-slate-800/40 hover:text-white",
                    isCustom && i > 0 && "border-t border-slate-800/60 mt-1 pt-3"
                  )}
                >
                  <span className={cn("flex items-center gap-2", isCustom && "text-slate-400")}>
                    {isCustom && <Calendar className="w-3.5 h-3.5" />}
                    {opt.label}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Inline date picker for custom */}
          {showPicker && (
            <div className="border-t border-slate-800 px-3 pb-3 pt-2">
              <DatePicker
                selected={startDate}
                onChange={(dates) => { const [s, e] = dates; setStartDate(s); setEndDate(e); }}
                startDate={startDate}
                endDate={endDate}
                selectsRange
                inline
                calendarClassName="custom-range-picker"
              />
              {startDate && endDate && (
                <p className="text-[11px] text-slate-500 text-center mt-2 mb-2">
                  {startDate.toLocaleDateString('mn-MN')} – {endDate.toLocaleDateString('mn-MN')}
                </p>
              )}
              <button
                onClick={handleApply}
                disabled={!startDate || !endDate}
                className="w-full px-3 py-2 bg-accent hover:bg-accent-hover text-slate-950 text-xs font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Хэрэгжүүлэх
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
