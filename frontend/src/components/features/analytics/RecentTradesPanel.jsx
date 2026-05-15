import { useLang } from "@/contexts/LanguageContext";
import { Clock } from "lucide-react";

const MNT_RATE = 3450;

function fmtPnl(v, currency) {
  if (!v && v !== 0) return '—';
  const n = parseFloat(v);
  if (currency === '₮') return `${n >= 0 ? '' : ''}${Math.round(n * MNT_RATE).toLocaleString()} ₮`;
  return `${n >= 0 ? '+' : ''}$${Math.abs(n).toFixed(2)}`;
}

function fmtDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('mn-MN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    + ' ' + d.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtPrice(p) {
  if (!p) return '—';
  const n = parseFloat(p);
  return n % 1 === 0 ? n.toFixed(2) : n.toPrecision(6);
}

export function RecentTradesPanel({ trades = [], currency = '$' }) {
  const { lang } = useLang();

  const recent = [...trades]
    .filter(t => t.status === 'CLOSED')
    .sort((a, b) => new Date(b.exit_date || b.entry_date || 0) - new Date(a.exit_date || a.entry_date || 0))
    .slice(0, 12);

  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-2xl flex flex-col h-full overflow-hidden hover:border-slate-700 transition-all duration-300">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/60 flex items-center gap-2 shrink-0">
        <Clock className="w-4 h-4 text-accent shrink-0" />
        <h3 className="text-sm font-semibold text-white">
          {lang === 'mn' ? 'Сүүлийн арилжаа' : 'Recent Trades'}
        </h3>
        <span className="ml-auto text-[11px] text-slate-600 font-medium">{recent.length}</span>
      </div>

      {/* Trade list */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {recent.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
            {lang === 'mn' ? 'Арилжаа байхгүй' : 'No trades'}
          </div>
        ) : (
          recent.map(trade => {
            const pnl = parseFloat(trade.pnl || 0);
            const isProfit = pnl >= 0;
            const isBuy = (trade.direction || '').toUpperCase() === 'LONG';

            return (
              <div key={trade.id} className="px-4 py-2.5 hover:bg-slate-800/30 transition-colors cursor-default">
                {/* Row 1: Symbol + direction + lot | Date + PnL */}
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-bold text-white truncate">{trade.symbol}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      isBuy ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {isBuy ? 'buy' : 'sell'}
                    </span>
                    {trade.position_size && (
                      <span className="text-[11px] text-slate-500 shrink-0">{parseFloat(trade.position_size).toFixed(2)}</span>
                    )}
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {fmtPnl(pnl, currency)}
                  </span>
                </div>

                {/* Row 2: Prices | Date */}
                <div className="flex items-center justify-between gap-2">
                  {trade.entry_price && trade.exit_price ? (
                    <span className="text-[11px] text-slate-600 font-mono">
                      {fmtPrice(trade.entry_price)} → {fmtPrice(trade.exit_price)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-700">—</span>
                  )}
                  <span className="text-[10px] text-slate-600 shrink-0">
                    {fmtDate(trade.exit_date || trade.entry_date)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
