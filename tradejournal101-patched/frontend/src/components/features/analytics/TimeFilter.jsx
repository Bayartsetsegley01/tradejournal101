import { useState, useRef, useEffect } from "react";
import { Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";

const filters = [
  { id: "today", label: "Өнөөдөр" },
  { id: "7d", label: "7 хоног" },
  { id: "1m", label: "1 сар" },
  { id: "3m", label: "3 сар" },
  { id: "6m", label: "6 сар" },
  { id: "1y", label: "1 жил" },
  { id: "all", label: "Бүх" },
];

export function TimeFilter({ value, onChange, customRange, onCustomRangeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState(customRange || { start: '', end: '', startTime: '', endTime: '' });
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApply = () => {
    onCustomRangeChange(tempRange);
    onChange('custom');
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempRange({ start: '', end: '', startTime: '', endTime: '' });
    onCustomRangeChange(null);
    onChange('7d');
    setIsOpen(false);
  };

  return (
    <div className="relative flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onChange(filter.id)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
            value === filter.id
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          )}
        >
          {filter.label}
        </button>
      ))}
      <div className="w-px h-4 bg-slate-800 mx-1" />
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors",
          value === 'custom' || isOpen
            ? "bg-slate-800 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
        )}
      >
        <Calendar className="w-3.5 h-3.5" />
        {value === 'custom' && customRange?.start && customRange?.end 
          ? `${customRange.start} - ${customRange.end}`
          : 'Custom'}
      </button>

      {isOpen && (
        <div ref={popoverRef} className="absolute top-full right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white">Хугацаа сонгох</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Эхлэх (From)</label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  value={tempRange?.start || ''}
                  onChange={(e) => setTempRange({...tempRange, start: e.target.value})}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none"
                />
                <input 
                  type="time" 
                  value={tempRange?.startTime || ''}
                  onChange={(e) => setTempRange({...tempRange, startTime: e.target.value})}
                  className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-sm text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-slate-400 mb-1">Дуусах (To)</label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  value={tempRange?.end || ''}
                  onChange={(e) => setTempRange({...tempRange, end: e.target.value})}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none"
                />
                <input 
                  type="time" 
                  value={tempRange?.endTime || ''}
                  onChange={(e) => setTempRange({...tempRange, endTime: e.target.value})}
                  className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-sm text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleClear}
                className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Цэвэрлэх
              </button>
              <button 
                onClick={handleApply}
                disabled={!tempRange.start || !tempRange.end}
                className="flex-1 px-3 py-2 bg-accent hover:bg-accent-hover text-slate-950 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Хэрэгжүүлэх
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
