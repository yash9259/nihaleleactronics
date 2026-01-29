
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 5000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

export const ReportsView: React.FC = () => {
  return (
    <div className="animate-in slide-in-from-right-4 duration-300 pb-12">
      <div className="mt-4">
        <h2 className="text-lg font-bold px-1 mb-4">Stock Trends</h2>
        <div className="bg-slate-900/40 p-4 rounded-3xl border border-slate-800/50 h-[220px] w-full">
          {/* Ensure ResponsiveContainer has a width and height relative to its parent */}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 10}}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 10}}
              />
              <Tooltip 
                contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px'}}
                itemStyle={{color: '#fff'}}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50">
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Weekly Growth</p>
           <h3 className="text-2xl font-bold">+24.8%</h3>
           <div className="mt-3 h-1 w-full bg-slate-800 rounded-full">
              <div className="h-full bg-blue-500 w-[70%] rounded-full shadow-[0_0_8px] shadow-blue-500/50" />
           </div>
        </div>
        <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50">
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Active Users</p>
           <h3 className="text-2xl font-bold">1,842</h3>
           <div className="mt-3 flex gap-1 items-end h-6">
              {[4, 8, 5, 9, 6, 10, 7].map((h, i) => (
                <div key={i} className="flex-1 bg-emerald-500/40 rounded-sm" style={{height: `${h*10}%`}} />
              ))}
           </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold px-1 mb-4">Regional Distribution</h2>
        <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/50 space-y-4">
           {['North Hub', 'South Warehouse', 'East Depot'].map((region, i) => (
             <div key={region}>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span>{region}</span>
                  <span className="text-slate-500">{(80 - i*15)}% Capacity</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                   <div 
                    className={`h-full rounded-full ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-indigo-500' : 'bg-purple-500'}`} 
                    style={{width: `${80 - i*15}%`}} 
                   />
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};
