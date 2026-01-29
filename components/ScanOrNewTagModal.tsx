import React from 'react';

interface ScanOrNewTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tab: 'scan' | 'new') => void;
}

const ScanOrNewTagModal: React.FC<ScanOrNewTagModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-xl w-72 flex flex-col items-center">
        <h2 className="text-lg font-bold mb-4 text-center">Choose Action</h2>
        <button
          className="w-full py-2 mb-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          onClick={() => { onSelect('scan'); onClose(); }}
        >
          Scan Tag
        </button>
        <button
          className="w-full py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
          onClick={() => { onSelect('new'); onClose(); }}
        >
          New Tag
        </button>
        <button
          className="mt-4 text-xs text-slate-500 hover:underline"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ScanOrNewTagModal;
