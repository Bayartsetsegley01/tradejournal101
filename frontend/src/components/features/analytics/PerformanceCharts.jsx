import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { analyticsService } from "@/services/analyticsService";
import { Loader2 } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

export function PerformanceCharts({ timeRange = '7d' }) {
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsService.getPerformance(timeRange)
      .then(res => { if (res?.success) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [timeRange]);

  if (loading) return (
    <div className="flex items-center justify-center h-48 col-span-2">
      <Loader2 className="w-6 h-6 text-accent animate-spin" />
    </div>
  );

  if (!data) return null;

  const emptyMsg = <p className="text-slate-500 text-sm py-8 text-center">No data</p>;

  const winTotal = (data.winLoss?.[0]?.value ?? 0) + (data.winLoss?.[1]?.value ?? 0);
  const winRate = winTotal > 0 ? Math.round((data.winLoss[0].value / winTotal) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* P&L by Asset — horizontal bar */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 hover:border-accent/30 transition-all duration-300">
        <h3 className="text-sm font-semibold text-white mb-4">P&L by Asset</h3>
        {data.byAsset.length === 0 ? emptyMsg : (
          <div style={{ height: Math.max(180, data.byAsset.length * 42) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byAsset} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={64} tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '10px', color: '#f8fafc', fontSize: 12 }}
                  formatter={v => [`$${v.toFixed(2)}`, 'P&L']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={600}>
                  {data.byAsset.map((entry, i) => (
                    <Cell key={i} fill={entry.value >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Win/Loss Donut */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 hover:border-accent/30 transition-all duration-300">
        <h3 className="text-sm font-semibold text-white mb-4">Win / Loss Ratio</h3>
        {(!data.winLoss || data.winLoss.every(d => d.value === 0)) ? emptyMsg : (
          <div className="h-[220px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.winLoss}
                  cx="50%" cy="50%"
                  innerRadius={65} outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  isAnimationActive
                  animationDuration={700}
                >
                  {data.winLoss.map((entry, i) => (
                    <Cell key={i} fill={i === 0 ? '#10b981' : '#f43f5e'} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '10px', color: '#f8fafc', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{winRate}%</p>
                <p className="text-xs text-slate-400 mt-0.5">Win Rate</p>
                <p className="text-xs text-slate-600 mt-1">{data.winLoss[0]?.value}W / {data.winLoss[1]?.value}L</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* P&L by Day of Week */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 hover:border-accent/30 transition-all duration-300">
        <h3 className="text-sm font-semibold text-white mb-4">P&L by Day of Week</h3>
        {data.byDayOfWeek.length === 0 ? emptyMsg : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byDayOfWeek} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} tick={{ fill: '#64748b' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '10px', color: '#f8fafc', fontSize: 12 }}
                  formatter={v => [`$${v.toFixed(2)}`, 'P&L']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={600}>
                  {data.byDayOfWeek.map((entry, i) => (
                    <Cell key={i} fill={entry.value >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Strategy Performance Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden hover:border-accent/30 transition-all duration-300">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Strategy Performance</h3>
        </div>
        {data.byStrategy.length === 0 ? (
          <p className="text-slate-500 text-sm p-5 text-center">No data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-5 py-3 text-left font-medium">Strategy</th>
                  <th className="px-4 py-3 text-right font-medium">Trades</th>
                  <th className="px-4 py-3 text-left font-medium min-w-[100px]">Win %</th>
                  <th className="px-4 py-3 text-right font-medium">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.byStrategy.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-5 py-3.5 font-medium text-slate-200">{s.name}</td>
                    <td className="px-4 py-3.5 text-right text-slate-400">{s.trades}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${s.winRate}%`,
                              backgroundColor: s.winRate >= 50 ? '#10b981' : '#f43f5e',
                            }}
                          />
                        </div>
                        <span className={`text-xs font-medium w-8 text-right ${s.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>{s.winRate}%</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3.5 text-right font-semibold ${s.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.pnl >= 0 ? '+' : ''}${Math.abs(s.pnl).toFixed(2)}
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
