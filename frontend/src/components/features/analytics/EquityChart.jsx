import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import { useLang } from "@/contexts/LanguageContext";
import { TrendingUp, TrendingDown } from "lucide-react";

const toLocalDateStr = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  const pnl = payload[0]?.payload?.pnl ?? 0;
  const fmt = (v) =>
    currency === '₮'
      ? `${v >= 0 ? '+' : ''}${Math.round(v * 3450).toLocaleString()} ₮`
      : `${v >= 0 ? '+' : '-'}$${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', minWidth: 140 }}>
      <p style={{ color: '#64748b', fontSize: 11, marginBottom: 6, fontWeight: 500 }}>{label}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ color: '#94a3b8', fontSize: 11 }}>Нийт</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: val >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(val)}</span>
      </div>
      {pnl !== 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 4 }}>
          <span style={{ color: '#94a3b8', fontSize: 11 }}>Энэ</span>
          <span style={{ fontWeight: 600, fontSize: 11, color: pnl >= 0 ? '#22c55e' : '#ef4444' }}>
            {pnl >= 0 ? '+' : '-'}
            {currency === '₮'
              ? Math.round(Math.abs(pnl) * 3450).toLocaleString() + ' ₮'
              : '$' + Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}

export function EquityChart({ data, currency = '$' }) {
  const { t } = useLang();

  const formattedData = (data || []).map(item => ({
    ...item,
    formattedDate: toLocalDateStr(item.date),
    value: item.equity,
  }));

  const lastVal = formattedData.length > 0 ? (formattedData[formattedData.length - 1]?.value ?? 0) : 0;
  const isPositive = lastVal >= 0;
  const isEmpty = formattedData.length === 0;

  const color = isPositive ? '#22c55e' : '#ef4444';

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
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {isPositive ? '+' : '-'}
            {currency === '₮'
              ? Math.round(Math.abs(lastVal) * 3450).toLocaleString() + ' ₮'
              : '$' + Math.abs(lastVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        {!isEmpty ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeWidth={0.8} />
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
                    ? `${Math.round(v * 3450 / 1000)}K₮`
                    : `$${v.toLocaleString()}`
                }
                dx={-4}
                tick={{ fill: '#475569' }}
                width={56}
              />
              <Tooltip
                content={<CustomTooltip currency={currency} />}
                cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.4 }}
              />
              <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" strokeWidth={1} />
              <Area
                type="natural"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={color}
                fillOpacity={0.15}
                dot={false}
                activeDot={{ r: 4, fill: color, stroke: '#0f172a', strokeWidth: 2 }}
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
