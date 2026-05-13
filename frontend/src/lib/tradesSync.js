// Lightweight event bus for cross-page trade data sync.
// Call notifyTradesUpdated() after any create/update/delete.
// Use useTradesUpdated(cb) in pages that display trade data.

import { useEffect } from 'react';

const EVENT = 'trades-updated';
const LS_KEY = 'trades_updated_at';

export const notifyTradesUpdated = () => {
  localStorage.setItem(LS_KEY, Date.now().toString());
  window.dispatchEvent(new CustomEvent(EVENT));
};

export const useTradesUpdated = (callback) => {
  useEffect(() => {
    const run = () => callback();
    const onStorage = (e) => { if (e.key === LS_KEY) run(); };
    const onVisible = () => { if (document.visibilityState === 'visible') run(); };

    window.addEventListener(EVENT, run);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener(EVENT, run);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [callback]);
};
