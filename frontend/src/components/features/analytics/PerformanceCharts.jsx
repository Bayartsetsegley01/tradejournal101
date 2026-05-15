import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { analyticsService } from "@/services/analyticsService";
import { Loader2 } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

const MNT_RATE = 3450;

const fmtPnl = (v, currency) => {
  if (currency === '₮') return `${v >= 0 ? '+' : ''}${Math.round(v * MNT_RATE).toLocaleString()} ₮`;
  return `${v >= 0 ? '+' : ''}$${Math.abs(v).toFixed(2)}`;
};

const tooltipStyle = {
  backgroundColor: '#1e293b',
  borderColor: '#334155',
  borderRadius: '12px',
  color: '#f1f5f9',
  fontSize: 12,
  boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
};

function ChartCard({ title, children, empty }) {
  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-300">
      <div className="px-5 pt-5 pb-3 border-b border-slate-800/60">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-5">
        {empty
          ? <p className="text-slate-600 text-sm py-6 text-center">Мэдээлэл байхгүй</p>
          : children
        }
      </div>
    </div>
  );
}

export function PerformanceCharts({ timeRange = '7d', accountId, currency = '$' }) {
  const { lang } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsService.getPerformance(timeRange, accountId)
      .then(res => { if (res?.success) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [timeRange, accountId]);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-6 h-6 text-accent animate-spin" />
    </div>
  );

  if (!data) return null;

  const winTotal = (data.winLoss?.[0]?.value ?? 0) + (data.winLoss?.[1]?.value ?? 0);
  const winRate = winTotal > 0 ? Math.round((data.winLoss[0].value / winTotal) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* P&L by Asset */}
      <ChartCard
        title={lang === 'mn' ? 'Хөрөнгөний ангилалаар' : 'P&L by Asset Class'}
        empty={data.byAsset.length === 0}
      >
        <div style={{ height: Math.max(160, data.byAsset.length * 44) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byAsset} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" horizontal={false} />
              <XAxis
                type="number" stroke="#475569" fontSize={10} tickLine={false} axisLine={false}
                tickFormatter={v => currency === '₮' ? `${Math.round(v * MNT_RATE / 1000)}K₮` : `$${v}`}
              />
              <YAxis
                type="category" dataKey="name" stroke="#475569" fontSize={11}
                tickLine={false} axisLine={false} width={60} tick={{ fill: '#94a3b8' }}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [fmtPnl(v, currency), 'P&L']} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={600}>
                {data.byAsset.map((entry, i) => (
                  <Cell key={i} fill={entry.value >= 0 ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Win/Loss Donut */}
      <ChartCard
        title={lang === 'mn' ? 'Ялалт / Ялагдал' : 'Win / Loss Ratio'}
        empty={!data.winLoss || data.winLoss.every(d => d.value === 0)}
      >
        <div className="h-[200px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.winLoss} cx="50%" cy="50%"
                innerRadius={60} outerRadius={82}
                paddingAngle={3} dataKey="value"
                isAnimationActive animationDuration={700}
              >
                {data.winLoss.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#10b981' : '#f43f5e'} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{winRate}%</p>
              <p className="text-xs text-slate-500 mt-0.5">{lang === 'mn' ? 'Ялалт' : 'Win Rate'}</p>
              <p className="text-xs text-slate-600 mt-1">
                <span className="text-emerald-400 font-medium">{data.winLoss[0]?.value}W</span>
                {' / '}
                <span className="text-rose-400 font-medium">{data.winLoss[1]?.value}L</span>
              </p>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* P&L by Day */}
      <ChartCard
        title={lang === 'mn' ? 'Гарагаар' : 'P&L by Day of Week'}
        empty={data.byDayOfWeek.length === 0}
      >
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byDayOfWeek} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
              <YAxis
                stroke="#475569" fontSize={10} tickLine={false} axisLine={false}
                tickFormatter={v => currency === '₮' ? `${Math.round(v * MNT_RATE / 1000)}K₮` : `$${v}`}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [fmtPnl(v, currency), 'P&L']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={600}>
                {data.byDayOfWeek.map((entry, i) => (
                  <Cell key={i} fill={entry.value >= 0 ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Strategy Table */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-300">
        <div className="px-5 pt-5 pb-3 border-b border-slate-800/60">
          <h3 className="text-sm font-semibold text-white">
            {lang === 'mn' ? 'Арга барилаар' : 'Strategy Performance'}
          </h3>
        </div>
        {data.byStrategy.length === 0 ? (
          <p className="text-slate-600 text-sm p-5 text-center">Мэдээлэл байхгүй</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-800/60">
                  <th className="px-5 py-3 text-left font-semibold">{lang === 'mn' ? 'Арга барил' : 'Strategy'}</th>
                  <th className="px-4 py-3 text-right font-semibold">{lang === 'mn' ? 'Арилжаа' : 'Trades'}</th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[100px]">{lang === 'mn' ? 'Ялалт %' : 'Win %'}</th>
                  <th className="px-4 py-3 text-right font-semibold">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {data.byStrategy.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-200 text-sm">{s.name}</td>
                    <td className="px-4 py-3.5 text-right text-slate-500 text-sm">{s.trades}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${s.winRate}%`, backgroundColor: s.winRate >= 50 ? '#10b981' : '#f43f5e' }}
                          />
                        </div>
                        <span className={`text-xs font-semibold w-8 text-right ${s.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {s.winRate}%
                        </span>
                      </div>
                    </td>
                    <td className={`px-4 py-3.5 text-right font-bold text-sm ${s.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {fmtPnl(s.pnl, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
