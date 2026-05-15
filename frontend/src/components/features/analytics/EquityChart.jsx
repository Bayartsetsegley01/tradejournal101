import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import { useLang } from "@/contexts/LanguageContext";
import { TrendingUp, TrendingDown } from "lucide-react";

const MNT_RATE = 3450;

function fmtVal(val, currency) {
  if (currency === '₮') return `${val >= 0 ? '+' : ''}${Math.round(val * MNT_RATE).toLocaleString()} ₮`;
  return `${val >= 0 ? '+' : ''}$${Math.abs(val).toFixed(2)}`;
}

function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  const pnl = payload[0]?.payload?.pnl ?? 0;
  return (
    <div className="bg-slate-800 border border-slate-700/60 rounded-xl shadow-2xl px-4 py-3 text-sm">
      <p className="text-slate-400 text-xs mb-2 font-medium">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500 text-xs">Нийт</span>
          <span className={`font-bold text-sm ${val >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {fmtVal(val, currency)}
          </span>
        </div>
        {pnl !== 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500 text-xs">Энэ</span>
            <span className={`font-semibold text-xs ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {pnl >= 0 ? '+' : ''}{currency === '₮' ? Math.round(pnl * MNT_RATE).toLocaleString() + ' ₮' : '$' + Math.abs(pnl).toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function EquityChart({ data, currency = '$' }) {
  const { t } = useLang();

  const formattedData = (data || []).map(item => {
    const dateObj = new Date(item.date);
    return {
      ...item,
      formattedDate: isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' }),
      value: item.equity,
    };
  });

  const lastVal = formattedData.length > 0 ? (formattedData[formattedData.length - 1]?.value ?? 0) : 0;
  const isPositive = lastVal >= 0;
  const isEmpty = formattedData.length === 0;

  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700 hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 h-[320px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-white">{t('equityCurve')}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{t('equitySubtitle')}</p>
        </div>
        {!isEmpty && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
            isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            {isPositive
              ? <TrendingUp className="w-3.5 h-3.5" />
              : <TrendingDown className="w-3.5 h-3.5" />
            }
            {fmtVal(Math.abs(lastVal), currency)}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        {!isEmpty ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="formattedDate"
                stroke="#334155"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={8}
                tick={{ fill: '#475569' }}
              />
              <YAxis
                stroke="#334155"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  currency === '₮'
                    ? `${Math.round(v * MNT_RATE / 1000)}K₮`
                    : v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v}`
                }
                dx={-4}
                tick={{ fill: '#475569' }}
                width={48}
              />
              <Tooltip
                content={<CustomTooltip currency={currency} />}
                cursor={{ stroke: isPositive ? '#10b981' : '#f43f5e', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.5 }}
              />
              <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" strokeWidth={1} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={isPositive ? '#10b981' : '#f43f5e'}
                strokeWidth={2}
                fill="url(#equityGrad)"
                dot={false}
                activeDot={{ r: 4, fill: isPositive ? '#10b981' : '#f43f5e', stroke: '#0f172a', strokeWidth: 2 }}
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
            <TrendingUp className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">{t('noDataChart')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
