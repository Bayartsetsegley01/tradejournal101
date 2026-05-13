import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { tradeService } from '@/services/tradeService';

const TradesContext = createContext(null);

export function TradesProvider({ children }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const result = await tradeService.getTrades();
      setTrades(result.data || []);
    } catch (e) {
      console.error('[TradesContext] refresh error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Optimistic helpers — immediately mutate local state
  const applyUpdate = useCallback((id, changes) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
  }, []);

  const applyRemove = useCallback((id) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  }, []);

  const applyAdd = useCallback((trade) => {
    setTrades(prev => [trade, ...prev]);
  }, []);

  // Call after any mutation: refresh from API + notify analytics pages
  const invalidate = useCallback(() => {
    refresh();
    localStorage.setItem('trades_updated_at', Date.now().toString());
    window.dispatchEvent(new CustomEvent('trades-updated'));
  }, [refresh]);

  return (
    <TradesContext.Provider value={{ trades, loading, refresh, invalidate, applyUpdate, applyRemove, applyAdd }}>
      {children}
    </TradesContext.Provider>
  );
}

export const useTrades = () => {
  const ctx = useContext(TradesContext);
  if (!ctx) throw new Error('useTrades must be inside TradesProvider');
  return ctx;
};
