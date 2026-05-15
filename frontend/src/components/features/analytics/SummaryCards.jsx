import { TrendingUp, TrendingDown, Target, Activity, Hash } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

const MNT_RATE = 3450;

function KPICard({ icon: Icon, label, value, badge, badgeCls, iconBg, iconCls }) {
  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700 hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 group cursor-default">
      <div className="flex items-start justify-between mb-5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconCls}`} />
        </div>
        {badge && (
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${badgeCls}`}>
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white font-mono tracking-tight leading-none">
          {value}
        </p>
        <p className="text-xs text-slate-500 mt-2 font-medium uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

export function SummaryCards({ data, timeRange = 'all', currency = '$' }) {
  const { t } = useLang();
  if (!data) return null;

  const rangeKeyMap = {
    today: 'rangeToday', '7d': 'range7d', '1m': 'range1m',
    '3m': 'range3m', '6m': 'range6m', '1y': 'range1y',
    all: 'rangeAll', custom: 'rangeCustom',
  };
  const rangeLabel = t(rangeKeyMap[timeRange] || 'rangeCustom');

  const formatCurrency = (val) => {
    if (currency === '₮') {
      const mnt = Math.round(val * MNT_RATE);
      const abs = Math.abs(mnt);
      return `${val >= 0 ? '+' : '-'}${abs.toLocaleString()} ₮`;
    }
    const abs = Math.abs(val);
    return `${val >= 0 ? '+' : '-'}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const isProfit = data.netPnl >= 0;
  const isGoodWinRate = data.winRate >= 50;
  const isGoodPF = data.profitFactor >= 1;

  const cards = [
    {
      icon: isProfit ? TrendingUp : TrendingDown,
      label: t('netPnlLabel'),
      value: formatCurrency(data.netPnl),
      badge: isProfit ? t('positive') : t('negative'),
      badgeCls: isProfit
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      iconBg: isProfit ? 'bg-emerald-500/10' : 'bg-rose-500/10',
      iconCls: isProfit ? 'text-emerald-400' : 'text-rose-400',
    },
    {
      icon: Target,
      label: t('winRateLabel'),
      value: `${data.winRate.toFixed(1)}%`,
      badge: isGoodWinRate ? '↑ 50%+' : '↓ 50%-',
      badgeCls: isGoodWinRate
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      iconBg: 'bg-sky-500/10',
      iconCls: 'text-sky-400',
    },
    {
      icon: Activity,
      label: t('profitFactorLabel'),
      value: data.profitFactor.toFixed(2),
      badge: isGoodPF ? '↑ 1.0+' : '↓ 1.0-',
      badgeCls: isGoodPF
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      iconBg: 'bg-violet-500/10',
      iconCls: 'text-violet-400',
    },
    {
      icon: Hash,
      label: t('totalTradesLabel'),
      value: data.totalTrades,
      badge: rangeLabel,
      badgeCls: 'bg-slate-800 text-slate-400 border border-slate-700',
      iconBg: 'bg-accent/10',
      iconCls: 'text-accent',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <KPICard key={i} {...card} />
      ))}
    </div>
  );
}
