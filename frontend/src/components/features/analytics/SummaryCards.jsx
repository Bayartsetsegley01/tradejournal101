import { ArrowUpRight, ArrowDownRight, TrendingUp, Target, Activity, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/contexts/LanguageContext";

function StatCard({ title, value, isPositive, icon: Icon, t }) {
  return (
    <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 flex flex-col hover:border-accent/30 hover:shadow-[0_0_15px_rgba(200,240,122,0.05)] transition-all duration-300 group cursor-default">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
          <Icon className="w-4 h-4 text-slate-400 group-hover:text-accent transition-colors" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={cn(
          "text-2xl font-bold font-mono group-hover:scale-105 origin-left transition-transform duration-300",
          isPositive ? "text-white" : "text-rose-400"
        )}>{value}</span>
      </div>
      <div className="mt-2 flex items-center gap-1">
        {isPositive
          ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          : <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
        }
        <span className={cn("text-xs font-medium", isPositive ? "text-emerald-400" : "text-rose-400")}>
          {isPositive ? t('positive') : t('negative')}
        </span>
      </div>
    </div>
  );
}

const MNT_RATE = 3450;

export function SummaryCards({ data, timeRange = 'all', currency = '$' }) {
  const { t } = useLang();
  if (!data) return null;

  const rangeKeyMap = { today: 'rangeToday', '7d': 'range7d', '1m': 'range1m', '3m': 'range3m', '6m': 'range6m', '1y': 'range1y', all: 'rangeAll', custom: 'rangeCustom' };
  const rangeLabel = t(rangeKeyMap[timeRange] || 'rangeCustom');

  const formatCurrency = (val) => {
    if (currency === '₮') {
      const mnt = Math.round(val * MNT_RATE);
      return `${val >= 0 ? '+' : ''}${mnt.toLocaleString()} ₮`;
    }
    const abs = Math.abs(val);
    return `${val >= 0 ? '+' : '-'}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const formatPercent = (val) => `${val.toFixed(1)}%`;
  const formatNumber = (val) => val.toFixed(2);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('netPnlLabel')} value={formatCurrency(data.netPnl)} isPositive={data.netPnl >= 0} icon={TrendingUp} t={t} />
        <StatCard title={t('winRateLabel')} value={formatPercent(data.winRate)} isPositive={data.winRate >= 50} icon={Target} t={t} />
        <StatCard title={t('profitFactorLabel')} value={formatNumber(data.profitFactor)} isPositive={data.profitFactor >= 1} icon={Activity} t={t} />
        <StatCard title={t('totalTradesLabel')} value={data.totalTrades} isPositive={true} icon={Hash} t={t} />
      </div>
      <p className="text-xs text-slate-500 text-right">
        {rangeLabel} {t('periodResult')}
      </p>
    </div>
  );
}
