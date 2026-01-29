
import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, ChevronRight } from 'lucide-react';

const products = [
  { id: '#1234', name: 'Standard Widget', stock: 450, category: 'Hardware', status: 'In Stock' },
  { id: '#5678', name: 'Deluxe Frame', stock: 12, category: 'Parts', status: 'Low Stock' },
  { id: '#9012', name: 'Smart Controller', stock: 89, category: 'Electronics', status: 'In Stock' },
  { id: '#3456', name: 'Legacy Sensor', stock: 0, category: 'Sensors', status: 'Out of Stock' },
];

export const StockView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="animate-in slide-in-from-right-4 duration-300">
      <div className="relative mt-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text" 
          placeholder="Search inventory..." 
          className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
        {['All', 'Hardware', 'Parts', 'Electronics', 'Sensors'].map((cat) => (
          <button key={cat} className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${cat === 'All' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center px-1">
        <span className="text-sm font-bold text-slate-400">Inventory Items</span>
        <button className="text-slate-500 hover:text-white transition-colors">
          <Filter size={18} />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {products.map((product) => (
          <div key={product.id} className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 flex items-center justify-between group hover:border-slate-700 transition-colors">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-slate-500">
                {product.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-[15px]">{product.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{product.id}</span>
                   <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded-md text-slate-400">{product.category}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${product.stock < 20 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {product.stock}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Available</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
