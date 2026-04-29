import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useLang } from "@/contexts/LanguageContext";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl px-4 py-3 text-sm">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className={`font-bold text-base ${val >= 0 ? 'text-accent' : 'text-rose-400'}`}>
        {val >= 0 ? '+' : ''}${val.toFixed(2)}
      </p>
    </div>
  );
}

export function EquityChart({ data }) {
  const { t } = useLang();

  const formattedData = (data || []).map(item => {
    const dateObj = new Date(item.date);
    return {
      ...item,
      formattedDate: isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' }),
      value: item.equity,
    };
  });

  const isPositive = formattedData.length === 0 || formattedData[formattedData.length - 1]?.value >= 0;

  return (
    <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 flex flex-col h-[340px] hover:border-accent/30 hover:shadow-[0_0_15px_rgba(200,240,122,0.05)] transition-all duration-300">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{t('equityCurve')}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{t('equitySubtitle')}</p>
        </div>
        {formattedData.length > 0 && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {isPositive ? '▲' : '▼'} {formattedData.length > 0 ? `$${Math.abs(formattedData[formattedData.length-1]?.value ?? 0).toFixed(2)}` : ''}
          </span>
        )}
      </div>

      <div className="flex-1 w-full min-h-0">
        {formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c8f07a" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#c8f07a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} strokeOpacity={0.6} />
              <XAxis
                dataKey="formattedDate"
                stroke="#334155"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={8}
                tick={{ fill: '#64748b' }}
              />
              <YAxis
                stroke="#334155"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
                dx={-4}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#c8f07a', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#c8f07a"
                strokeWidth={2}
                fill="url(#equityGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#c8f07a', stroke: '#0f172a', strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
            {t('noDataChart')}
          </div>
        )}
      </div>
    </div>
  );
}
