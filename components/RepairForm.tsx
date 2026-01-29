
import React, { useState } from 'react';
import { ArrowLeft, Save, User, Phone, MapPin, Wrench, AlertTriangle, CheckCircle, Sparkles, DollarSign, Plus, Camera } from 'lucide-react';
import { RepairRecord, RepairStatus, StockItem } from '../types';
import { supabase } from '../lib/supabase';

interface RepairFormProps {
  initialData?: RepairRecord;
  jobId: string;
  onSave: (record: RepairRecord) => void;
  onCancel: () => void;
  stockItems: StockItem[];
  onConsumePart: (jobId: string, stockItemId: string, quantity: number) => void;
}

export const RepairForm: React.FC<RepairFormProps> = ({ initialData, jobId, onSave, onCancel, stockItems, onConsumePart }) => {
  const isNewJob = !initialData;

  const [formData, setFormData] = useState<RepairRecord>(initialData || {
    id: jobId,
    customerName: '',
    contactNumber: '',
    address: '',
    product: '',
    issue: '',
    status: 'quoted',
    dateAdded: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedCost: 0,
    devicePhotoUrl: ''
  });

  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${jobId}/${fileName}`;

    setUploading(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('damaged-devices')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('damaged-devices')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, devicePhotoUrl: data.publicUrl }));
    } catch (error) {
      console.error('Error uploading image: ', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const statuses: { value: RepairStatus; label: string; color: string }[] = [
    { value: 'quoted', label: 'Quote Given', color: 'bg-amber-500' },
    { value: 'approved', label: 'Approved', color: 'bg-indigo-500' },
    { value: 'working', label: 'On Workbench', color: 'bg-blue-500' },
    { value: 'completed', label: 'Job Finished', color: 'bg-emerald-500' },
  ];

  // Sync local state when initialData updates (e.g. when parts are added)
  React.useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        partsUsed: initialData.partsUsed,
        updatedAt: initialData.updatedAt
      }));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      updatedAt: new Date().toISOString()
    });
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setFormData({ ...formData, estimatedCost: isNaN(val) ? 0 : val });
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-300 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 bg-slate-900 rounded-xl text-slate-400">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold">{isNewJob ? 'Register New Job' : 'Job Update'}</h2>
            <p className="text-[10px] text-blue-500 font-mono font-bold tracking-widest">{jobId}</p>
          </div>
        </div>
        {isNewJob && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full border border-blue-500/20">
            <Sparkles size={12} className="animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest">New Entry</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Status Pipeline */}
        <div className="bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">Repair Stage</label>
          <div className="grid grid-cols-2 gap-3">
            {statuses.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setFormData({ ...formData, status: s.value })}
                className={`py-3.5 px-4 rounded-2xl text-[10px] font-bold uppercase tracking-wider border-2 transition-all flex items-center justify-center gap-2 ${formData.status === s.value
                  ? `${s.color} border-white text-white shadow-lg`
                  : 'border-slate-800 bg-slate-950/50 text-slate-500'
                  }`}
              >
                {formData.status === s.value && <CheckCircle size={12} />}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Section */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Customer Details</h3>

          <div className="relative group">
            <User className="absolute left-4 top-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text" required
              placeholder="Customer Full Name"
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-blue-500 outline-none transition-all"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
          </div>

          <div className="relative group">
            <Phone className="absolute left-4 top-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="tel" required
              placeholder="Contact Number"
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-blue-500 outline-none transition-all"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
            />
          </div>

          <div className="relative group">
            <MapPin className="absolute left-4 top-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
            <textarea
              placeholder="Pickup/Delivery Address"
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm min-h-[80px] focus:border-blue-500 outline-none transition-all"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>

        {/* Product Section */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Item Specifications</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative group col-span-2">
              <Wrench className="absolute left-4 top-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text" required
                placeholder="Product (e.g., Washing Machine)"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-blue-500 outline-none transition-all"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              />
            </div>

            <div className="relative group col-span-2">
              <DollarSign className="absolute left-4 top-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="number" step="0.01"
                placeholder="Estimated Cost ($)"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-emerald-500 outline-none transition-all font-bold text-emerald-500"
                value={formData.estimatedCost || ''}
                onChange={handleCostChange}
              />
            </div>
          </div>

          <div className="relative group">
            <AlertTriangle className="absolute left-4 top-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
            <textarea
              placeholder="Describe the problem..." required
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm min-h-[100px] focus:border-blue-500 outline-none transition-all"
              value={formData.issue}
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
            />
          </div>

          <div className="relative group">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Device Photo Evidence</h4>
            <div className="flex items-center gap-4">
              <label className="relative cursor-pointer bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-2xl w-24 h-24 flex items-center justify-center transition-all group overflow-hidden">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
                {formData.devicePhotoUrl ? (
                  <img src={formData.devicePhotoUrl} alt="Device" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-500 group-hover:text-blue-500">
                    <Camera size={24} />
                    <span className="text-[9px] font-bold">{uploading ? '...' : 'ADD'}</span>
                  </div>
                )}
              </label>
              {formData.devicePhotoUrl && (
                <p className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle size={12} />
                  Photo Attached
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Spare Parts Section - Only Visible in Working Status */}
        {formData.status === 'working' && (
          <div className="bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Spare Parts & Materials</h3>

            {/* Add Part Form */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-4 pr-8 text-sm appearance-none outline-none focus:border-blue-500"
                  id="part-select"
                >
                  <option value="">Select Part...</option>
                  {stockItems.map(item => (
                    <option key={item.id} value={item.id} disabled={item.quantity <= 0}>
                      {item.name} ({item.quantity} in stock) - ₹{item.price}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <Wrench size={14} />
                </div>
              </div>
              <input
                type="number"
                id="part-qty"
                placeholder="Qty"
                className="w-20 bg-slate-950 border border-slate-800 rounded-xl py-3 px-3 text-sm text-center outline-none focus:border-blue-500"
                min="1"
              />
              <button
                type="button"
                onClick={() => {
                  const select = document.getElementById('part-select') as HTMLSelectElement;
                  const qtyInput = document.getElementById('part-qty') as HTMLInputElement;
                  const stockId = select.value;
                  const qty = parseInt(qtyInput.value);

                  if (stockId && qty > 0) {
                    onConsumePart(jobId, stockId, qty);
                    select.value = "";
                    qtyInput.value = "";
                  }
                }}
                className="bg-blue-500 text-white rounded-xl px-4 flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Used Parts List */}
            <div className="space-y-2">
              {formData.partsUsed?.map((part) => (
                <div key={part.id} className="flex justify-between items-center bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                      <Wrench size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{part.name}</p>
                      <p className="text-[10px] text-slate-500">{new Date(part.dateUsed).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">x{part.quantity}</p>
                    <p className="text-[10px] text-emerald-500 font-bold">₹{part.cost}</p>
                  </div>
                </div>
              ))}
              {(!formData.partsUsed || formData.partsUsed.length === 0) && (
                <p className="text-center text-[10px] text-slate-600 italic py-2">No parts used yet</p>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-5 bg-blue-600 rounded-[2rem] font-bold flex items-center justify-center gap-3 shadow-xl shadow-blue-600/30 active:scale-95 transition-all text-white"
        >
          <Save size={20} />
          {isNewJob ? 'Register & Save Tag' : 'Update Job Progress'}
        </button>
      </form>
    </div>
  );
};
