import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";

const pnlByAssetData = [
  { name: "Crypto", value: 800 },
  { name: "Forex", value: -100 },
  { name: "Stock", value: 0 },
];

const winLossData = [
  { name: "Wins", value: 64 },
  { name: "Losses", value: 36 },
];

const COLORS = ['#10b981', '#f43f5e', '#64748b'];

export function PerformanceCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* P&L by Asset Class */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 hover:border-accent/30 hover:shadow-[0_0_15px_rgba(200,240,122,0.05)] transition-all duration-300">
        <div className="mb-6">
          <h3 className="text-base font-medium text-white">P&L by Asset Class (Төрлөөр)</h3>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pnlByAssetData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip 
                cursor={{ fill: '#1e293b' }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                formatter={(value) => [`$${value}`, 'P&L']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {pnlByAssetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Win / Loss Ratio */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 hover:border-accent/30 hover:shadow-[0_0_15px_rgba(200,240,122,0.05)] transition-all duration-300">
        <div className="mb-6">
          <h3 className="text-base font-medium text-white">Win / Loss Ratio</h3>
        </div>
        <div className="h-[250px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={winLossData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {winLossData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                formatter={(value) => [`${value}%`, 'Rate']}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-white">64%</span>
            <span className="text-xs text-slate-400">Win Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
