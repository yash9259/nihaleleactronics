
import React, { useState } from 'react';
import { Search, Filter, ChevronRight, Clock, User, Wrench, DollarSign } from 'lucide-react';
import { RepairRecord, RepairStatus } from '../types';

interface JobBoardViewProps {
  repairs: RepairRecord[];
  onEditJob: (id: string) => void;
}

export const JobBoardView: React.FC<JobBoardViewProps> = ({ repairs, onEditJob }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<RepairStatus | 'all'>('all');

  const filteredRepairs = repairs.filter(r => {
    const matchesSearch = 
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || r.status === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: RepairStatus) => {
    switch (status) {
      case 'quoted': return 'text-amber-500 bg-amber-500/10';
      case 'approved': return 'text-indigo-500 bg-indigo-500/10';
      case 'working': return 'text-blue-500 bg-blue-500/10';
      case 'completed': return 'text-emerald-500 bg-emerald-500/10';
    }
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-300">
      <div className="relative mt-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text" 
          placeholder="Search jobs, customers, IDs..." 
          className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
        {(['all', 'quoted', 'approved', 'working', 'completed'] as const).map((cat) => (
          <button 
            key={cat} 
            onClick={() => setActiveFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
              cat === activeFilter ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center px-1">
        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest text-[10px]">Active Repairs ({filteredRepairs.length})</span>
        <button className="text-slate-500 hover:text-white transition-colors">
          <Filter size={18} />
        </button>
      </div>

      <div className="mt-4 space-y-3 pb-24">
        {filteredRepairs.map((job) => (
          <div 
            key={job.id} 
            onClick={() => onEditJob(job.id)}
            className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 flex flex-col gap-4 group hover:border-blue-500/30 transition-all cursor-pointer active:scale-[0.98]"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center">
                  <Wrench size={20} className="text-slate-500" />
                </div>
                <div>
                  <h4 className="font-bold text-[15px]">{job.product}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <User size={12} /> {job.customerName}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
                {job.estimatedCost !== undefined && (
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
                    <DollarSign size={10} /> {job.estimatedCost.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-slate-800/40">
              <span className="text-[10px] font-mono text-blue-500">{job.id}</span>
              <div className="flex items-center gap-1 text-[10px] text-slate-600">
                <Clock size={12} />
                {new Date(job.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}

        {filteredRepairs.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-4 text-slate-600">
            <Wrench size={48} className="opacity-20" />
            <p className="font-bold uppercase tracking-widest text-xs">No Jobs Found</p>
          </div>
        )}
      </div>
    </div>
  );
};
