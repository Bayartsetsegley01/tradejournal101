import { useState, useRef, useEffect } from "react";
import { Search, Filter, ChevronDown, X, Check, SlidersHorizontal, History, Trash2 } from "lucide-react";
import { MARKET_TYPES, SESSIONS } from "@/lib/constants";

export function TradeFilters({ filters, setFilters }) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const marketDropdownRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('tradeSearchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse search history", e);
      }
    }
  }, []);

  const saveSearchToHistory = (query) => {
    if (!query || query.trim() === '') return;
    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('tradeSearchHistory', JSON.stringify(newHistory));
  };

  const removeSearchHistoryItem = (e, item) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter(i => i !== item);
    setSearchHistory(newHistory);
    localStorage.setItem('tradeSearchHistory', JSON.stringify(newHistory));
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveSearchToHistory(filters.search);
      setIsSearchFocused(false);
    }
  };

  // Mock search suggestions based on user input
  const getSearchSuggestions = (query) => {
    if (!query) return [];
    const q = query.toLowerCase();
    const allSuggestions = [
      { type: 'Symbol', value: 'EURUSD' },
      { type: 'Symbol', value: 'XAUUSD' },
      { type: 'Symbol', value: 'BTCUSD' },
      { type: 'Session', value: 'London' },
      { type: 'Session', value: 'New York' },
      { type: 'Strategy', value: 'Breakout Strategy' },
      { type: 'Strategy', value: 'Trend Following' },
      { type: 'Tag', value: 'revenge-trading' },
      { type: 'Tag', value: 'fomo' },
      { type: 'Market', value: 'Crypto' },
      { type: 'Market', value: 'Forex' },
    ];
    return allSuggestions.filter(s => s.value.toLowerCase().includes(q));
  };

  const searchSuggestions = getSearchSuggestions(filters.search);

  useEffect(() => {
    function handleClickOutside(event) {
      if (marketDropdownRef.current && !marketDropdownRef.current.contains(event.target)) {
        setIsMarketDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMarket = (marketId) => {
    setFilters(prev => {
      const newMarkets = prev.markets.includes(marketId)
        ? prev.markets.filter(m => m !== marketId)
        : [...prev.markets, marketId];
      return { ...prev, markets: newMarkets };
    });
  };

  const removeFilter = (key, value = null) => {
    if (key === 'markets') {
      setFilters(prev => ({ ...prev, markets: prev.markets.filter(m => m !== value) }));
    } else if (key === 'hasScreenshot' || key === 'hasNotes') {
      setFilters(prev => ({ ...prev, [key]: false }));
    } else {
      setFilters(prev => ({ ...prev, [key]: 'all' }));
    }
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      timeRange: 'all',
      status: 'all',
      markets: [],
      direction: 'all',
      session: 'all',
      hasScreenshot: false,
      hasNotes: false,
    });
  };

  const hasActiveFilters = 
    filters.markets.length > 0 || 
    filters.timeRange !== 'all' || 
    filters.status !== 'all' || 
    filters.direction !== 'all' || 
    filters.session !== 'all' || 
    filters.hasScreenshot || 
    filters.hasNotes;

  return (
    <div className="flex flex-col gap-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md" ref={searchRef}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Хайх (Symbol, Strategy, Tag)..." 
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all hover:bg-slate-900"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={handleSearchKeyDown}
          />
          
          {/* Search Suggestions Dropdown */}
          {isSearchFocused && (filters.search || searchHistory.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                
                {/* Search History */}
                {!filters.search && searchHistory.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Сүүлд хайсан</div>
                    {searchHistory.map((item, index) => (
                      <button
                        key={`hist-${index}`}
                        className="w-full text-left px-4 py-2 hover:bg-slate-700/50 transition-colors flex items-center justify-between group"
                        onClick={() => {
                          setFilters({ ...filters, search: item });
                          setIsSearchFocused(false);
                        }}
                      >
                        <div className="flex items-center gap-2 text-sm text-slate-300 group-hover:text-white transition-colors">
                          <History className="w-3.5 h-3.5 text-slate-500" />
                          {item}
                        </div>
                        <div 
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-600 rounded transition-all"
                          onClick={(e) => removeSearchHistoryItem(e, item)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {filters.search && searchSuggestions.length > 0 && (
                  <div>
                    <div className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Санал болгох</div>
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={`sug-${index}`}
                        className="w-full text-left px-4 py-2 hover:bg-slate-700/50 transition-colors flex items-center justify-between group"
                        onClick={() => {
                          setFilters({ ...filters, search: suggestion.value });
                          saveSearchToHistory(suggestion.value);
                          setIsSearchFocused(false);
                        }}
                      >
                        <span className="text-sm text-white group-hover:text-accent transition-colors">{suggestion.value}</span>
                        <span className="text-xs text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded-md">{suggestion.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Quick Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          
          {/* Market Multi-select Dropdown */}
          <div className="relative shrink-0" ref={marketDropdownRef}>
            <button 
              onClick={() => setIsMarketDropdownOpen(!isMarketDropdownOpen)}
              className={`flex items-center gap-2 bg-slate-900/50 border rounded-xl pl-4 pr-3 py-2.5 text-sm transition-all hover:bg-slate-900 ${filters.markets.length > 0 ? 'border-accent/50 text-accent' : 'border-slate-800 text-slate-300'}`}
            >
              {filters.markets.length === 0 ? 'Бүх зах зээл' : `${filters.markets.length} зах зээл`}
              <ChevronDown className="w-4 h-4 opacity-50" />
            </button>
            
            {isMarketDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 pb-2 mb-2 border-b border-slate-700/50 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Зах зээл</span>
                  {filters.markets.length > 0 && (
                    <button onClick={() => setFilters(prev => ({...prev, markets: []}))} className="text-xs text-slate-400 hover:text-white">Цэвэрлэх</button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {MARKET_TYPES.map(market => {
                    const isSelected = filters.markets.includes(market.id);
                    return (
                      <button
                        key={market.id}
                        onClick={() => toggleMarket(market.id)}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <span>{market.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-accent" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Time Range */}
          <div className="relative shrink-0">
            <select 
              className={`bg-slate-900/50 border rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 appearance-none min-w-[130px] cursor-pointer transition-all hover:bg-slate-900 ${filters.timeRange !== 'all' ? 'border-accent/50 text-accent' : 'border-slate-800 text-slate-300'}`}
              value={filters.timeRange}
              onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
            >
              <option value="all">Бүх хугацаа</option>
              <option value="today">Өнөөдөр</option>
              <option value="7d">7 хоног</option>
              <option value="1m">1 сар</option>
              <option value="3m">3 сар</option>
              <option value="6m">6 сар</option>
              <option value="1y">1 жил</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          {/* Status */}
          <div className="relative shrink-0">
            <select 
              className={`bg-slate-900/50 border rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 appearance-none min-w-[120px] cursor-pointer transition-all hover:bg-slate-900 ${filters.status !== 'all' ? 'border-accent/50 text-accent' : 'border-slate-800 text-slate-300'}`}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">Бүх төлөв</option>
              <option value="PLANNED">Planned</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
          
          {/* Advanced Toggle */}
          <button 
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`bg-slate-900/50 hover:bg-slate-800 border rounded-xl px-4 py-2.5 text-sm transition-all flex items-center gap-2 shrink-0 ${isAdvancedOpen ? 'border-accent/50 text-accent' : 'border-slate-800 text-slate-300'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Дэлгэрэнгүй
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {isAdvancedOpen && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Direction */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Чиглэл</label>
              <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                {['all', 'LONG', 'SHORT'].map(dir => (
                  <button
                    key={dir}
                    onClick={() => setFilters({ ...filters, direction: dir })}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${filters.direction === dir ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                  >
                    {dir === 'all' ? 'Бүгд' : dir}
                  </button>
                ))}
              </div>
            </div>

            {/* Session */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Сешн</label>
              <select 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-accent/50"
                value={filters.session}
                onChange={(e) => setFilters({ ...filters, session: e.target.value })}
              >
                <option value="all">Бүх сешн</option>
                {SESSIONS.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Media & Notes */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Нэмэлт</label>
              <div className="flex flex-wrap gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.hasScreenshot ? 'bg-accent border-accent' : 'bg-slate-950 border-slate-700 group-hover:border-slate-500'}`}>
                    {filters.hasScreenshot && <Check className="w-3.5 h-3.5 text-slate-950" />}
                  </div>
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Screenshot-той</span>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={filters.hasScreenshot}
                    onChange={(e) => setFilters({ ...filters, hasScreenshot: e.target.checked })}
                  />
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.hasNotes ? 'bg-accent border-accent' : 'bg-slate-950 border-slate-700 group-hover:border-slate-500'}`}>
                    {filters.hasNotes && <Check className="w-3.5 h-3.5 text-slate-950" />}
                  </div>
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Тэмдэглэлтэй</span>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={filters.hasNotes}
                    onChange={(e) => setFilters({ ...filters, hasNotes: e.target.checked })}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 mr-1">Идэвхтэй шүүлтүүр:</span>
          
          {filters.markets.map(mId => {
            const market = MARKET_TYPES.find(m => m.id === mId);
            return market ? (
              <span key={`m-${mId}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                {market.label}
                <button onClick={() => removeFilter('markets', mId)} className="hover:bg-blue-500/20 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
              </span>
            ) : null;
          })}

          {filters.timeRange !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
              Хугацаа: {filters.timeRange}
              <button onClick={() => removeFilter('timeRange')} className="hover:bg-slate-700 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}

          {filters.status !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
              Төлөв: {filters.status}
              <button onClick={() => removeFilter('status')} className="hover:bg-amber-500/20 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}

          {filters.direction !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
              Чиглэл: {filters.direction}
              <button onClick={() => removeFilter('direction')} className="hover:bg-accent/20 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}

          {filters.session !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium">
              Сешн: {SESSIONS.find(s => s.id === filters.session)?.label || filters.session}
              <button onClick={() => removeFilter('session')} className="hover:bg-purple-500/20 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}

          {filters.hasScreenshot && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
              Screenshot-той
              <button onClick={() => removeFilter('hasScreenshot')} className="hover:bg-accent/20 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}

          {filters.hasNotes && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
              Тэмдэглэлтэй
              <button onClick={() => removeFilter('hasNotes')} className="hover:bg-accent/20 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}

          <button 
            onClick={clearAllFilters}
            className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2 ml-2 transition-colors"
          >
            Бүгдийг цэвэрлэх
          </button>
        </div>
      )}
    </div>
  );
}
