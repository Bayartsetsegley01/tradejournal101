import { ArrowUpRight, ArrowDownRight, TrendingUp, Target, Activity, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({ title, value, trend, isPositive, icon: Icon }) {
  return (
    <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 flex flex-col hover:border-accent/30 hover:shadow-[0_0_15px_rgba(200,240,122,0.05)] transition-all duration-300 group cursor-default">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
          <Icon className="w-4 h-4 text-slate-400 group-hover:text-accent transition-colors" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white font-mono group-hover:scale-105 origin-left transition-transform duration-300">{value}</span>
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1.5">
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          )}
          <span className={cn("text-xs font-medium", isPositive ? "text-emerald-400" : "text-rose-400")}>
            {trend}
          </span>
          <span className="text-xs text-slate-500 ml-1">vs last period</span>
        </div>
      )}
    </div>
  );
}

export function SummaryCards({ data }) {
  if (!data) return null;

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const formatPercent = (val) => `${val.toFixed(1)}%`;
  const formatNumber = (val) => val.toFixed(2);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        title="Net P&L" 
        value={formatCurrency(data.netPnl)} 
        isPositive={data.netPnl >= 0} 
        icon={TrendingUp}
      />
      <StatCard 
        title="Win Rate" 
        value={formatPercent(data.winRate)} 
        isPositive={data.winRate >= 50} 
        icon={Target}
      />
      <StatCard 
        title="Profit Factor" 
        value={formatNumber(data.profitFactor)} 
        isPositive={data.profitFactor >= 1.5} 
        icon={Activity}
      />
      <StatCard 
        title="Total Trades" 
        value={data.totalTrades} 
        isPositive={true} 
        icon={Hash}
      />
    </div>
  );
}
