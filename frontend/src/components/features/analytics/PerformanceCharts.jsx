import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { analyticsService } from "@/services/analyticsService";
import { Loader2 } from "lucide-react";

const COLORS = ['#10b981', '#f43f5e', '#64748b', '#f59e0b', '#6366f1', '#ec4899'];

export function PerformanceCharts({ timeRange = '7d' }) {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* P&L by Asset Class */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 hover:border-accent/30 transition-all duration-300">
        <h3 className="text-base font-medium text-white mb-4">P&L by Asset Class</h3>
        {data.byAsset.length === 0 ? (
          <p className="text-slate-500 text-sm">Дата байхгүй</p>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byAsset} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(value, name, props) => [`$${value}`, 'P&L']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.byAsset.map((entry, i) => (
                    <Cell key={i} fill={entry.value >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Win/Loss Ratio */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 hover:border-accent/30 transition-all duration-300">
        <h3 className="text-base font-medium text-white mb-4">Win / Loss Ratio</h3>
        {(!data.winLoss || data.winLoss.every(d => d.value === 0)) ? (
          <p className="text-slate-500 text-sm">Дата байхгүй</p>
        ) : (
          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.winLoss} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.winLoss.map((entry, i) => (
                    <Cell key={i} fill={i === 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {data.winLoss[0]?.value + data.winLoss[1]?.value > 0
                    ? Math.round((data.winLoss[0]?.value / (data.winLoss[0]?.value + data.winLoss[1]?.value)) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-slate-400">Win Rate</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* P&L by Day of Week */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 hover:border-accent/30 transition-all duration-300">
        <h3 className="text-base font-medium text-white mb-4">P&L by Day of Week</h3>
        {data.byDayOfWeek.length === 0 ? (
          <p className="text-slate-500 text-sm">Дата байхгүй</p>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byDayOfWeek} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(value) => [`$${value}`, 'P&L']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.byDayOfWeek.map((entry, i) => (
                    <Cell key={i} fill={entry.value >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Strategy Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden hover:border-accent/30 transition-all duration-300">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-base font-medium text-white">Strategy Performance</h3>
        </div>
        {data.byStrategy.length === 0 ? (
          <p className="text-slate-500 text-sm p-5">Дата байхгүй</p>
        ) : (
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
                {data.byStrategy.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-200">{s.name}</td>
                    <td className="px-5 py-3.5 text-right text-slate-300">{s.trades}</td>
                    <td className="px-5 py-3.5 text-right text-slate-300">{s.winRate}%</td>
                    <td className={`px-5 py-3.5 text-right font-medium ${s.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
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
