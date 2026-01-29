
import React from 'react';
import { Package, AlertCircle, CheckCircle2, Clock, Plus, QrCode, ClipboardList, Wrench } from 'lucide-react';
import { StatCard } from './StatCard';
import { StatData, Activity, RepairRecord } from '../types';

interface DashboardViewProps {
  onNavigateToQR: () => void;
  onNavigateToInventory: () => void;
  repairs: RepairRecord[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToQR, onNavigateToInventory, repairs }) => {
  const activeJobs = repairs.filter(r => r.status !== 'completed').length;
  const pendingQuotes = repairs.filter(r => r.status === 'quoted').length;

  // Real revenue calculation based on completed jobs or estimated value of all jobs
  const totalRevenue = repairs.reduce((acc, r) => acc + (r.estimatedCost || 0), 0);
  const completedRevenue = repairs
    .filter(r => r.status === 'completed')
    .reduce((acc, r) => acc + (r.estimatedCost || 0), 0);

  const stats: StatData[] = [
    {
      label: "Active Jobs",
      value: activeJobs.toString(),
      change: "+2",
      trend: 'up',
      icon: <Wrench />,
      color: "text-blue-500"
    },
    {
      label: "Open Quotes",
      value: pendingQuotes.toString(),
      change: "+1",
      trend: 'up',
      icon: <AlertCircle />,
      color: "text-orange-500"
    },
    {
      label: "Total Repaired",
      value: repairs.filter(r => r.status === 'completed').length.toString(),
      change: "+12.5%",
      trend: 'up',
      icon: <CheckCircle2 />,
      color: "text-emerald-500"
    },
    {
      label: "Workshop Load",
      value: "65%",
      change: "-5%",
      trend: 'down',
      icon: <Clock />,
      color: "text-purple-500"
    }
  ];

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      {/* Welcome Banner */}
      <div className={`mt-4 p-6 rounded-[2.5rem] shadow-xl mb-8 
        ${typeof window !== 'undefined' && document.body.classList.contains('bg-slate-50')
          ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-slate-900 shadow-blue-200/20'
          : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-500/20'}`}
      >
        <h2 className="text-xl font-bold">Welcome Back, Chief!</h2>
        <p className="text-xs opacity-80 mt-1">You have {activeJobs} jobs currently on the workbench.</p>
        <div className="mt-6 flex gap-4">
          <div className={`${typeof window !== 'undefined' && document.body.classList.contains('bg-slate-50') ? 'bg-blue-100 text-blue-900' : 'bg-white/20 text-white'} px-4 py-2 rounded-2xl flex-1`}>
            <p className="text-[10px] font-bold uppercase opacity-60">Estimated Revenue</p>
            <p className="text-sm font-bold">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className={`${typeof window !== 'undefined' && document.body.classList.contains('bg-slate-50') ? 'bg-blue-100 text-blue-900' : 'bg-white/20 text-white'} px-4 py-2 rounded-2xl flex-1`}>
            <p className="text-[10px] font-bold uppercase opacity-60">Completed</p>
            <p className="text-sm font-bold">${completedRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4 px-1">Shop Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onNavigateToQR()}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-purple-600 rounded-[2rem] text-white shadow-xl shadow-purple-600/20 active:scale-95 transition-transform"
          >
            <QrCode size={24} />
            <span className="font-bold text-sm">Issue Tag</span>
          </button>
          <button
            onClick={onNavigateToInventory}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-900 rounded-[2rem] text-white border border-slate-800 active:scale-95 transition-transform"
          >
            <ClipboardList size={24} className="text-blue-500" />
            <span className="font-bold text-sm">Inventory</span>
          </button>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="mt-8 mb-8">
        <h2 className="text-lg font-bold mb-4 px-1">Recent Activity</h2>
        <div className="bg-slate-900/40 rounded-[2rem] overflow-hidden border border-slate-800/50">
          {repairs.slice(0, 4).map((job, idx) => (
            <div
              key={job.id}
              className={`p-5 flex items-center justify-between group cursor-pointer hover:bg-slate-800/30 transition-colors ${idx !== repairs.length - 1 ? 'border-b border-slate-800/40' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${job.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'} shadow-[0_0_8px] shadow-current`} />
                <div>
                  <h4 className="font-bold text-sm">{job.product}</h4>
                  <p className="text-xs text-slate-500">{job.customerName}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 font-mono">{job.id}</span>
                {job.estimatedCost !== undefined && (
                  <span className="text-[10px] text-emerald-500 font-bold">${job.estimatedCost.toFixed(2)}</span>
                )}
              </div>
            </div>
          ))}
          {repairs.length === 0 && (
            <div className="p-10 text-center text-slate-600 text-xs font-bold uppercase tracking-widest">No recent jobs</div>
          )}
        </div>
      </div>
    </div>
  );
};
