import React, { useState } from 'react';
import { Plus, Search, Package, IndianRupee } from 'lucide-react';
import { StockItem } from '../types';
import { motion } from 'framer-motion';

interface InventoryViewProps {
    items: StockItem[];
    onAddItem: (item: Omit<StockItem, 'id' | 'lastUpdated'>) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ items, onAddItem }) => {
    const [viewMode, setViewMode] = useState<'list' | 'add'>('list');
    const [newItem, setNewItem] = useState({ name: '', quantity: '', price: '', category: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddItem({
            name: newItem.name,
            quantity: parseInt(newItem.quantity) || 0,
            price: parseFloat(newItem.price) || 0,
            category: newItem.category || 'General'
        });
        setNewItem({ name: '', quantity: '', price: '', category: '' });
        setViewMode('list'); // Switch back to list after adding
    };

    return (
        <div className="animate-in slide-in-from-right-4 duration-300 pb-24">
            {/* Internal Tabs */}
            <div className="flex p-1 bg-slate-900/50 backdrop-blur-md rounded-2xl mx-4 mt-4 border border-slate-800">
                <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${viewMode === 'list'
                            ? 'bg-slate-800 text-white shadow-lg'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    Current Stock
                </button>
                <button
                    onClick={() => setViewMode('add')}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${viewMode === 'add'
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    Add Stock
                </button>
            </div>

            {viewMode === 'list' ? (
                <>
                    {/* Header Stat Card */}
                    <div className="mt-4 mx-4 bg-gradient-to-br from-emerald-600 to-teal-600 p-6 rounded-[2rem] text-white shadow-xl shadow-emerald-500/20">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-lg font-bold">Inventory Value</h2>
                                <p className="text-emerald-100 text-xs opacity-80 mt-1">Total Assets</p>
                            </div>
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <IndianRupee size={20} />
                            </div>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-3xl font-bold">
                                ₹ {items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()}
                            </h3>
                        </div>
                    </div>

                    <div className="mt-6 mx-4 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search stock..."
                            className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    <div className="mt-6 px-4 space-y-3">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Stock Items</h3>

                        {items.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Package size={48} className="mx-auto mb-3 opacity-20" />
                                <p>No items in stock</p>
                            </div>
                        ) : (
                            items.map(item => (
                                <div key={item.id} className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">{item.name}</h4>
                                            <p className="text-xs text-slate-500">{item.category}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">{item.quantity} units</p>
                                        <p className="text-xs text-emerald-500">₹{item.price}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                /* Add Stock Form */
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 px-4"
                >
                    <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">New Item</h2>
                                <p className="text-slate-500 text-sm">Add to inventory</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Name of Product</label>
                                <input
                                    autoFocus
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 mt-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    placeholder="e.g., iPhone 15 Screen"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Quantity</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 mt-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                        value={newItem.quantity}
                                        onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 mt-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                        value={newItem.price}
                                        onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/25 mt-4 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={20} />
                                Add to Stock
                            </button>
                        </form>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
