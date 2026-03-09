
import React from 'react';
import { RepairRecord } from '../types';

interface DashboardViewProps {
  onNavigateToQR: () => void;
  onNavigateToInventory: () => void;
  repairs: RepairRecord[];
  userName?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToQR, onNavigateToInventory, repairs, userName }) => {
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const today = new Date();
  const completedToday = repairs.filter(r => {
    const date = r.updatedAt ? new Date(r.updatedAt) : new Date(r.dateAdded);
    return r.status === 'completed' && isSameDay(date, today);
  }).length;

  const notReviewed = repairs.filter(r => r.status === 'quoted').length;
  const estimateApproved = repairs.filter(r => r.status === 'approved').length;
  const onWorkbench = repairs.filter(r => r.status === 'working').length;
  const readyToDeliver = repairs.filter(r => r.status === 'completed').length;

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="mt-2 p-5 border border-black/20 rounded-[2.2rem] bg-white text-black shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold leading-tight">Welcome,</h2>
            <h3 className="text-2xl font-semibold leading-tight">{userName || 'User'}</h3>
            <p className="text-xs mt-2">{completedToday} job complated today</p>
          </div>
          <button
            onClick={onNavigateToQR}
            className="w-24 h-24 rounded-[1.8rem] border border-black/30 flex items-center justify-center text-sm leading-tight text-center active:scale-95 transition-transform"
          >
            payment
            <br />
            qr
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="border border-black/30 rounded-2xl p-4 text-center">
          <p className="text-lg leading-tight">not</p>
          <p className="text-lg leading-tight">reviewed</p>
          <p className="text-[11px] mt-2 text-black/70">{notReviewed} jobs</p>
        </div>
        <div className="border border-black/30 rounded-2xl p-4 text-center">
          <p className="text-lg leading-tight">estimate</p>
          <p className="text-lg leading-tight">approved</p>
          <p className="text-[11px] mt-2 text-black/70">{estimateApproved} jobs</p>
        </div>
        <div className="border border-black/30 rounded-2xl p-4 text-center">
          <p className="text-lg leading-tight">on</p>
          <p className="text-lg leading-tight">workbench</p>
          <p className="text-[11px] mt-2 text-black/70">{onWorkbench} jobs</p>
        </div>
        <div className="border border-black/30 rounded-2xl p-4 text-center">
          <p className="text-lg leading-tight">ready to</p>
          <p className="text-lg leading-tight">deliver</p>
          <p className="text-[11px] mt-2 text-black/70">{readyToDeliver} jobs</p>
        </div>
      </div>

      <div className="mt-6 px-1">
        <p className="text-lg">resent activities</p>
        {repairs.length > 0 && (
          <div className="mt-3 space-y-2">
            {repairs.slice(0, 3).map((job) => (
              <div key={job.id} className="flex justify-between text-xs text-black/70">
                <span>{job.product}</span>
                <span>{job.customerName}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center justify-center">
        <button
          onClick={onNavigateToQR}
          className="w-24 h-24 rounded-full border border-black/30 flex items-center justify-center text-sm text-center active:scale-95 transition-transform"
        >
          qr
          <br />
          scanner
        </button>
      </div>
    </div>
  );
};
