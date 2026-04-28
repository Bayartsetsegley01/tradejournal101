import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const MARKET_OPTIONS = [
  { id: 'crypto',      label: 'Crypto',       symbol: '₿', color: 'text-blue-400'   },
  { id: 'forex',       label: 'Forex',        symbol: '$', color: 'text-emerald-400' },
  { id: 'stock',       label: 'Stock',        symbol: '📈', color: 'text-indigo-400' },
  { id: 'gold',        label: 'Gold',         symbol: '🥇', color: 'text-amber-400'  },
  { id: 'commodities', label: 'Commodities',  symbol: '🛢',  color: 'text-orange-400' },
  { id: 'indices',     label: 'Indices',      symbol: '📊', color: 'text-purple-400' },
  { id: 'futures',     label: 'Futures',      symbol: '⏱', color: 'text-cyan-400'   },
  { id: 'options',     label: 'Options',      symbol: '⚙', color: 'text-pink-400'   },
];

export function MarketSelect({ value, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = MARKET_OPTIONS.find(m => m.id === value) || MARKET_OPTIONS[1];

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className={`relative select-none ${className}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="flex items-center gap-2 w-36 bg-slate-950 border border-accent/60 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:ring-1 focus:ring-accent/30 transition-colors hover:border-accent/80"
      >
        <span className="text-base leading-none">{selected.symbol}</span>
        <span className={`font-medium flex-1 text-left ${selected.color}`}>{selected.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div
        className={`absolute top-full left-0 mt-1 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 py-1 overflow-hidden transition-all duration-200 origin-top ${open ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}
        style={{ transformOrigin: 'top' }}
      >
        {MARKET_OPTIONS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(m.id); setOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-accent/10 hover:text-accent ${value === m.id ? 'bg-accent/5 text-accent' : 'text-slate-300'}`}
          >
            <span className="text-base w-5 text-center leading-none">{m.symbol}</span>
            <span className="font-medium">{m.label}</span>
            {value === m.id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
          </button>
        ))}
      </div>
    </div>
  );
}
