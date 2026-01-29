
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, LayoutGrid, ClipboardList, Scan, Package, BarChart3, QrCode, Wrench } from 'lucide-react';
import ScanOrNewTagModal from './ScanOrNewTagModal';
import { Tab } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

interface LayoutPropsWithFirm extends LayoutProps {
  firmName?: string;
}

export const Layout: React.FC<LayoutPropsWithFirm> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  isDarkMode, 
  toggleDarkMode, 
  firmName
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleModalSelect = (tab: 'scan' | 'new') => {
    if (tab === 'scan') onTabChange(Tab.SEARCH);
    else if (tab === 'new') onTabChange(Tab.QR_GENERATE);
  };

  return (
    <div className={`flex flex-col h-screen max-w-md mx-auto relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-start z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl text-white">
            <Wrench size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{firmName || 'Repair Hub'}</h1>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}> 
              Shop Management
            </p>
          </div>
        </div>
        <button 
          onClick={toggleDarkMode}
          className={`p-2 rounded-xl transition-all active:scale-90 ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-900 shadow-sm hover:bg-slate-100'}`}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto px-4 pb-24 custom-scrollbar">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-6 py-4 flex items-center justify-between z-20 ${isDarkMode ? 'bg-slate-900/80 backdrop-blur-lg border-t border-slate-800' : 'bg-white/80 backdrop-blur-lg border-t border-slate-200'}`}>
        <NavItem 
          icon={<LayoutGrid size={20} />} 
          label="Home" 
          active={activeTab === Tab.DASHBOARD} 
          onClick={() => onTabChange(Tab.DASHBOARD)}
          isDark={isDarkMode}
        />
        <NavItem 
          icon={<ClipboardList size={20} />} 
          label="Tasks" 
          active={activeTab === Tab.WORK} 
          onClick={() => onTabChange(Tab.WORK)}
          isDark={isDarkMode}
        />

        {/* Single Floating Action Button */}
        <div className="relative -top-8 flex flex-1 justify-center">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setModalOpen(true)}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 bg-blue-600 text-white shadow-blue-500/40`}
            >
              <Scan size={28} />
            </button>
            <span className={`text-[9px] font-bold mt-2 text-blue-500`}>
              TAG ACTION
            </span>
          </div>
        </div>

        <NavItem 
          icon={<Package size={20} />} 
          label="Job Board" 
          active={activeTab === Tab.STOCK} 
          onClick={() => onTabChange(Tab.STOCK)}
          isDark={isDarkMode}
        />
        <NavItem 
          icon={<BarChart3 size={20} />} 
          label="Stats" 
          active={activeTab === Tab.REPORT} 
          onClick={() => onTabChange(Tab.REPORT)}
          isDark={isDarkMode}
        />
      </nav>
      <ScanOrNewTagModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSelect={handleModalSelect} />
    </div>
  );
};

const NavItem: React.FC<{ 
  icon: React.ReactNode, 
  label: string, 
  active: boolean, 
  onClick: () => void,
  isDark: boolean
}> = ({ icon, label, active, onClick, isDark }) => (
  <motion.button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 flex-1 py-1 focus:outline-none`}
    animate={active ? { scale: 1.18, boxShadow: '0 6px 24px 0 rgba(128,0,255,0.18)' } : { scale: 1, boxShadow: 'none' }}
    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
    style={{
      background: active ? 'linear-gradient(135deg, #a084ee 60%, #7f53ac 100%)' : 'transparent',
      color: active ? '#fff' : isDark ? '#64748b' : '#94a3b8',
      borderRadius: active ? 20 : 12,
      position: 'relative',
      zIndex: active ? 2 : 1,
      minHeight: 56,
    }}
  >
    <motion.span
      className="flex items-center justify-center w-8 h-8"
      animate={active ? { scale: 1.2, rotate: 0 } : { scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
    >
      {icon}
    </motion.span>
    <motion.span
      className="text-[9px] font-bold tracking-wide uppercase"
      animate={active ? { color: '#ede9fe' } : { color: isDark ? '#64748b' : '#94a3b8' }}
      transition={{ duration: 0.2 }}
    >
      {label}
    </motion.span>
  </motion.button>
);
