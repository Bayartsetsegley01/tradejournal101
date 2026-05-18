import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X, Check, SlidersHorizontal, History, Trash2 } from "lucide-react";
import { MARKET_TYPES, SESSIONS } from "@/lib/constants";
import { useLang } from "@/contexts/LanguageContext";
import { TimeFilter } from "@/components/features/analytics/TimeFilter";

export function TradeFilters({ filters, setFilters, customRange, onCustomRangeChange }) {
  const { t } = useLang();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const marketDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tradeSearchHistory');
      if (saved) setSearchHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const saveSearchToHistory = (query) => {
    if (!query?.trim()) return;
    const next = [query, ...searchHistory.filter(i => i !== query)].slice(0, 5);
    setSearchHistory(next);
    localStorage.setItem('tradeSearchHistory', JSON.stringify(next));
  };

  const removeHistoryItem = (e, item) => {
    e.stopPropagation();
    const next = searchHistory.filter(i => i !== item);
    setSearchHistory(next);
    localStorage.setItem('tradeSearchHistory', JSON.stringify(next));
  };

  useEffect(() => {
    const handler = (e) => {
      if (marketDropdownRef.current && !marketDropdownRef.current.contains(e.target))
        setIsMarketDropdownOpen(false);
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target))
        setIsStatusDropdownOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target))
        setIsSearchFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleMarket = (id) =>
    setFilters(prev => ({
      ...prev,
      markets: prev.markets.includes(id) ? prev.markets.filter(m => m !== id) : [...prev.markets, id],
    }));

  const STATUS_OPTIONS = [
    { value: 'all',     label: t('allStatus') },
    { value: 'PLANNED', label: t('planned') },
    { value: 'OPEN',    label: t('open') },
    { value: 'CLOSED',  label: t('closed') },
  ];

  const clearAllFilters = () => {
    setFilters({ search: '', timeRange: 'all', status: 'all', markets: [], direction: 'all', session: 'all', hasScreenshot: false, hasNotes: false });
    localStorage.setItem('analytics_time_range', 'all');
  };

  const hasActiveFilters =
    filters.markets.length > 0 || filters.timeRange !== 'all' || filters.status !== 'all' ||
    filters.direction !== 'all' || filters.session !== 'all' || filters.hasScreenshot || filters.hasNotes;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Single row ── */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Хайх (Symbol, Strategy, Tag)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-600 transition-all hover:border-slate-700"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={e => { if (e.key === 'Enter') { saveSearchToHistory(filters.search); setIsSearchFocused(false); } }}
          />

          {/* Search dropdown */}
          {isSearchFocused && (filters.search || searchHistory.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
              {!filters.search && searchHistory.length > 0 && (
                <>
                  <p className="px-4 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Сүүлийн хайлт</p>
                  {searchHistory.map((item, i) => (
                    <button key={i} className="w-full text-left px-4 py-2 hover:bg-slate-700/50 flex items-center justify-between group"
                      onClick={() => { setFilters({ ...filters, search: item }); setIsSearchFocused(false); }}>
                      <span className="flex items-center gap-2 text-sm text-slate-300 group-hover:text-white">
                        <History className="w-3.5 h-3.5 text-slate-500" />{item}
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-600 rounded transition-all"
                        onClick={e => removeHistoryItem(e, item)}>
                        <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Market dropdown */}
        <div className="relative shrink-0" ref={marketDropdownRef}>
          <button
            onClick={() => { setIsMarketDropdownOpen(v => !v); setIsStatusDropdownOpen(false); }}
            className={`flex items-center gap-2 border rounded-xl px-3.5 py-2.5 text-sm transition-all ${
              filters.markets.length > 0
                ? 'bg-slate-800 border-slate-600 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            {filters.markets.length === 0 ? 'Бүх зах зээл' : `${filters.markets.length} зах зээл`}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isMarketDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMarketDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 pb-2 pt-1 mb-1 border-b border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Зах зээл</span>
                {filters.markets.length > 0 && (
                  <button onClick={() => setFilters(p => ({ ...p, markets: [] }))} className="text-[11px] text-slate-500 hover:text-white transition-colors">Цэвэрлэх</button>
                )}
              </div>
              {MARKET_TYPES.map(m => (
                <button key={m.id} onClick={() => toggleMarket(m.id)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors">
                  <span>{m.label}</span>
                  {filters.markets.includes(m.id) && <Check className="w-3.5 h-3.5 text-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status dropdown */}
        <div className="relative shrink-0" ref={statusDropdownRef}>
          <button
            onClick={() => { setIsStatusDropdownOpen(v => !v); setIsMarketDropdownOpen(false); }}
            className={`flex items-center gap-2 border rounded-xl px-3.5 py-2.5 text-sm transition-all ${
              filters.status !== 'all'
                ? 'bg-slate-800 border-slate-600 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            {STATUS_OPTIONS.find(o => o.value === filters.status)?.label ?? 'Бүх төлөв'}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isStatusDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-44 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => { setFilters(p => ({ ...p, status: opt.value })); setIsStatusDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    filters.status === opt.value ? 'text-white bg-slate-800/60' : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
                  }`}>
                  {opt.label}
                  {filters.status === opt.value && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setIsAdvancedOpen(v => !v)}
          className={`flex items-center gap-2 border rounded-xl px-3.5 py-2.5 text-sm transition-all shrink-0 ${
            isAdvancedOpen
              ? 'bg-slate-800 border-slate-600 text-white'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Дэлгэрэнгүй
        </button>

        {/* Time filter */}
        <TimeFilter
          value={filters.timeRange}
          onChange={v => setFilters(f => ({ ...f, timeRange: v }))}
          customRange={customRange}
          onCustomRangeChange={onCustomRangeChange}
        />

        {/* Clear all */}
        {hasActiveFilters && (
          <button onClick={clearAllFilters}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 shrink-0">
            <X className="w-3.5 h-3.5" />
            Цэвэрлэх
          </button>
        )}
      </div>

      {/* Advanced panel */}
      {isAdvancedOpen && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Direction */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Чиглэл</label>
              <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                {['all', 'LONG', 'SHORT'].map(dir => (
                  <button key={dir} onClick={() => setFilters({ ...filters, direction: dir })}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      filters.direction === dir ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'
                    }`}>
                    {dir === 'all' ? 'Бүгд' : dir}
                  </button>
                ))}
              </div>
            </div>

            {/* Session */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Session</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilters({ ...filters, session: 'all' })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    filters.session === 'all' ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}>Бүгд</button>
                {SESSIONS.map(s => (
                  <button key={s.id} onClick={() => setFilters({ ...filters, session: s.id })}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      filters.session === s.id ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}>{s.label}</button>
                ))}
              </div>
            </div>

            {/* Extras */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Нэмэлт</label>
              <div className="flex flex-wrap gap-4 mt-2">
                {[
                  { key: 'hasScreenshot', label: 'Screenshot байгаа' },
                  { key: 'hasNotes',      label: 'Тэмдэглэл байгаа' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      filters[key] ? 'bg-accent border-accent' : 'bg-slate-950 border-slate-700 group-hover:border-slate-500'
                    }`}>
                      {filters[key] && <Check className="w-3.5 h-3.5 text-slate-950" />}
                    </div>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
                    <input type="checkbox" className="hidden" checked={filters[key]}
                      onChange={e => setFilters({ ...filters, [key]: e.target.checked })} />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-600">Шүүлт:</span>
          {filters.markets.map(id => {
            const m = MARKET_TYPES.find(x => x.id === id);
            return m ? (
              <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                {m.label}
                <button onClick={() => setFilters(p => ({ ...p, markets: p.markets.filter(x => x !== id) }))} className="hover:bg-blue-500/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </span>
            ) : null;
          })}
          {filters.status !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
              {filters.status}
              <button onClick={() => setFilters(p => ({ ...p, status: 'all' }))} className="hover:bg-amber-500/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.direction !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
              {filters.direction}
              <button onClick={() => setFilters(p => ({ ...p, direction: 'all' }))} className="hover:bg-accent/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.session !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium">
              {SESSIONS.find(s => s.id === filters.session)?.label || filters.session}
              <button onClick={() => setFilters(p => ({ ...p, session: 'all' }))} className="hover:bg-purple-500/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.hasScreenshot && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
              Screenshot
              <button onClick={() => setFilters(p => ({ ...p, hasScreenshot: false }))} className="hover:bg-slate-700 rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.hasNotes && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
              Тэмдэглэл
              <button onClick={() => setFilters(p => ({ ...p, hasNotes: false }))} className="hover:bg-slate-700 rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
