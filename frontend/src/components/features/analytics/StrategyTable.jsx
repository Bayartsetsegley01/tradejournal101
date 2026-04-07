import { cn } from "@/lib/utils";

const strategies = [
  { name: "Breakout", trades: 15, winRate: 70, pnl: 850 },
  { name: "Supply/Demand", trades: 10, winRate: 50, pnl: -120 },
  { name: "Trend Following", trades: 8, winRate: 62.5, pnl: 340 },
  { name: "Mean Reversion", trades: 5, winRate: 40, pnl: -50 },
  { name: "News Scalp", trades: 4, winRate: 75, pnl: 220.5 },
];

export function StrategyTable() {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden hover:border-accent/30 hover:shadow-[0_0_15px_rgba(200,240,122,0.05)] transition-all duration-300">
      <div className="p-5 border-b border-slate-800">
        <h3 className="text-base font-medium text-white">Strategy Performance (Стратегиар)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3 font-medium">Strategy</th>
              <th className="px-5 py-3 font-medium text-right">Trades</th>
              <th className="px-5 py-3 font-medium text-right">Win %</th>
              <th className="px-5 py-3 font-medium text-right">Net P&L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {strategies.map((strategy, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-3.5 font-medium text-slate-200">{strategy.name}</td>
                <td className="px-5 py-3.5 text-right text-slate-300">{strategy.trades}</td>
                <td className="px-5 py-3.5 text-right text-slate-300">{strategy.winRate}%</td>
                <td className={cn(
                  "px-5 py-3.5 text-right font-medium",
                  strategy.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {strategy.pnl >= 0 ? "+" : ""}${Math.abs(strategy.pnl).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
