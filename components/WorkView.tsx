
import React, { useState } from 'react';
import { Calendar, MoreVertical, ListTodo } from 'lucide-react';

const allTasks = [
  { id: 1, title: 'Restock Hardware Aisle', priority: 'High', status: 'pending', deadline: 'Today' },
  { id: 2, title: 'Update QR labels on Warehouse B', priority: 'Medium', status: 'approved', deadline: 'Tomorrow' },
  { id: 3, title: 'Verify month-end inventory', priority: 'High', status: 'quoted', deadline: '3 days left' },
  { id: 4, title: 'Archive legacy data', priority: 'Low', status: 'completed', deadline: 'Done' },
  { id: 5, title: 'Order new parts', priority: 'Medium', status: 'pending', deadline: '2 days left' },
  { id: 6, title: 'Customer follow-up', priority: 'High', status: 'approved', deadline: 'Tomorrow' },
  { id: 7, title: 'Prepare monthly report', priority: 'Low', status: 'quoted', deadline: '5 days left' },
  { id: 8, title: 'Clean workbench', priority: 'Low', status: 'completed', deadline: 'Done' },
];

const statusLabels = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'completed', label: 'Completed' },
];

export const WorkView: React.FC = () => {
  const [activeStatus, setActiveStatus] = useState('all');
  const filteredTasks = activeStatus === 'all'
    ? allTasks
    : allTasks.filter(task => task.status === activeStatus);

  return (
    <div className="animate-in slide-in-from-right-4 duration-300 pb-12">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-[2rem] mt-4 text-white shadow-xl shadow-indigo-600/20">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold">Task List</h2>
            <p className="text-indigo-100 text-xs opacity-80 mt-1">View and filter all tasks by status</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
             <ListTodo size={20} />
          </div>
        </div>
      </div>

      <div className="mt-8 px-1 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {statusLabels.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveStatus(s.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeStatus === s.key ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {filteredTasks.length === 0 && (
          <div className="text-center text-slate-500 py-12">No tasks found for this status.</div>
        )}
        {filteredTasks.map(task => (
          <div key={task.id} className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 hover:bg-slate-900/60 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                task.priority === 'High' ? 'bg-rose-500/10 text-rose-500' : 
                task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 
                'bg-slate-700/50 text-slate-400'
              }`}>
                {task.priority} Priority
              </span>
              <button className="text-slate-600 hover:text-white transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
            <h4 className="font-bold text-[15px] mb-4 leading-tight">{task.title}</h4>
            <div className="flex justify-between items-center pt-4 border-t border-slate-800/50">
               <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar size={14} />
                  <span className="text-[11px] font-semibold">{task.deadline}</span>
               </div>
               <span className={`text-[11px] font-bold ${task.status === 'completed' ? 'text-emerald-500' : task.status === 'approved' ? 'text-indigo-500' : task.status === 'quoted' ? 'text-orange-500' : 'text-blue-500'}`}>
                 {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
               </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
