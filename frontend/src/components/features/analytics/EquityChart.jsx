import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export function EquityChart({ data }) {
  // Format the date for the X-axis
  const formattedData = (data || []).map(item => {
    const dateObj = new Date(item.date);
    return {
      ...item,
      formattedDate: isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.equity // Map equity to value for the chart
    };
  });

  return (
    <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 flex flex-col h-[400px] hover:border-accent/30 hover:shadow-[0_0_15px_rgba(200,240,122,0.05)] transition-all duration-300">
      <div className="mb-6">
        <h3 className="text-base font-medium text-white">Equity Curve (Өсөлтийн муруй)</h3>
        <p className="text-sm text-slate-400">Таны нийт дансны өсөлт</p>
      </div>
      
      <div className="flex-1 w-full h-full min-h-0">
        {formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c8f07a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c8f07a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="formattedDate" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `$${value}`}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                itemStyle={{ color: '#c8f07a', fontWeight: 500 }}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                formatter={(value) => [`$${value.toFixed(2)}`, 'Equity']}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#c8f07a" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            Хангалттай дата байхгүй байна
          </div>
        )}
      </div>
    </div>
  );
}
