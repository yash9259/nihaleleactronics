
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { StatData } from '../types';

export const StatCard: React.FC<StatData> = ({ label, value, change, trend, icon, color }) => {
  // Detect light mode by checking the document body class (tailwind dark mode is class-based)
  const isLightMode = typeof window !== 'undefined' && document.body.classList.contains('bg-slate-50');
  return (
    <div
      className={`rounded-2xl p-4 border transition-all group cursor-pointer 
        ${isLightMode ? 'bg-white border-slate-200 hover:bg-slate-100' : 'bg-slate-900/50 border-slate-800/50 hover:bg-slate-900'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl bg-opacity-10 group-hover:scale-110 transition-transform ${color.replace('text-', 'bg-')}`}> 
          {React.cloneElement(icon as React.ReactElement<any>, { size: 20, className: color })}
        </div>
        <div className={`flex items-center gap-0.5 text-[10px] font-bold ${trend === 'up' ? (isLightMode ? 'text-emerald-600' : 'text-emerald-500') : (isLightMode ? 'text-rose-600' : 'text-rose-500')}`}>
          {trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {change}
        </div>
      </div>
      <div>
        <h3 className={`text-xl font-bold mb-1 ${isLightMode ? 'text-slate-900' : ''}`}>{value}</h3>
        <p className={`text-[11px] uppercase tracking-wider font-semibold ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>{label}</p>
      </div>
    </div>
  );
};
