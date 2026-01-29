
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DashboardView } from './components/DashboardView';
import { JobBoardView } from './components/JobBoardView';
import { WorkView } from './components/WorkView';
import { QRGenerateView } from './components/QRGenerateView';
import { ScannerView } from './components/ScannerView';
import { RepairForm } from './components/RepairForm';
import { Tab, RepairRecord, StockItem, UsedPart } from './types';

import { LoginView } from './components/LoginView';
import { InventoryView } from './components/InventoryView';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentFirmId, setCurrentFirmId] = useState<string>('');

  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [editingRepairId, setEditingRepairId] = useState<string | null>(null);

  // Handle Login
  const handleLogin = (firmId: string) => {
    setCurrentFirmId(firmId);
    setIsAuthenticated(true);
  };

  // Handle Logout (Optional but good for testing)
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentFirmId('');
    setRepairs([]); // Clear current state
    setStockItems([]);
  };

  // Fetch Data from Supabase
  const fetchData = async () => {
    if (!currentFirmId) return;

    // Fetch Repairs
    const { data: repairsData, error: repairsError } = await supabase
      .from('repairs')
      .select('*')
      .eq('firm_id', currentFirmId)
      .order('created_at', { ascending: false });

    if (repairsData) setRepairs(repairsData);
    if (repairsError) console.error('Error fetching repairs:', repairsError);

    // Fetch Stock
    const { data: stockData, error: stockError } = await supabase
      .from('stock_items')
      .select('*')
      .eq('firm_id', currentFirmId)
      .order('last_updated', { ascending: false });

    if (stockData) setStockItems(stockData);
    if (stockError) console.error('Error fetching stock:', stockError);
  };

  // Initial Load & Subscriptions could go here
  useEffect(() => {
    if (isAuthenticated && currentFirmId) {
      fetchData();
    }
  }, [isAuthenticated, currentFirmId]);

  const saveRepair = async (record: RepairRecord) => {
    // Optimistic Update
    setRepairs(prev => {
      const exists = prev.find(r => r.id === record.id);
      if (exists) {
        return prev.map(r => r.id === record.id ? record : r);
      }
      return [record, ...prev];
    });

    // Supabase Update
    const { error } = await supabase
      .from('repairs')
      .upsert({
        id: record.id,
        firm_id: currentFirmId,
        customer_name: record.customerName,
        contact_number: record.contactNumber,
        address: record.address,
        product: record.product,
        issue: record.issue,
        status: record.status,
        estimated_cost: record.estimatedCost,
        device_photo_url: record.devicePhotoUrl,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving repair:', error);
      alert('Failed to save to database');
    }

    setEditingRepairId(null);
    setActiveTab(Tab.STOCK); // Go to job board after saving
  };

  const handleAddStock = async (newItem: Omit<StockItem, 'id' | 'lastUpdated'>) => {
    const item: StockItem = {
      ...newItem,
      id: Date.now().toString(),
      lastUpdated: new Date().toISOString()
    };

    // Optimistic Update
    setStockItems(prev => [item, ...prev]);

    // Supabase Insert
    const { error } = await supabase
      .from('stock_items')
      .insert({
        id: item.id,
        firm_id: currentFirmId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        category: item.category,
        last_updated: item.lastUpdated
      });

    if (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add stock to database');
    }
  };

  const handleConsumePart = (jobId: string, stockItemId: string, quantity: number) => {
    const stockItem = stockItems.find(i => i.id === stockItemId);
    const job = repairs.find(r => r.id === jobId);

    if (!stockItem || !job || stockItem.quantity < quantity) {
      alert("Invalid operation: Insufficient stock or item not found.");
      return;
    }

    // 1. Deduct Stock
    const updatedStock = stockItems.map(item =>
      item.id === stockItemId
        ? { ...item, quantity: item.quantity - quantity }
        : item
    );
    setStockItems(updatedStock);

    // 2. Add to Job Record
    const usedPart: UsedPart = {
      id: Date.now().toString(),
      stockItemId: stockItem.id,
      name: stockItem.name,
      quantity: quantity,
      cost: stockItem.price * quantity,
      dateUsed: new Date().toISOString()
    };

    const updatedRepairs = repairs.map(r =>
      r.id === jobId
        ? { ...r, partsUsed: [...(r.partsUsed || []), usedPart] }
        : r
    );
    setRepairs(updatedRepairs);
  };

  const handleScanSuccess = (id: string) => {
    setEditingRepairId(id);
  };


  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderContent = () => {
    // If we are currently editing/viewing a specific repair form
    if (editingRepairId) {
      const existing = repairs.find(r => r.id === editingRepairId);
      return (
        <RepairForm
          initialData={existing}
          jobId={editingRepairId}
          onSave={saveRepair}
          onCancel={() => setEditingRepairId(null)}
          stockItems={stockItems}
          onConsumePart={handleConsumePart}
        />
      );
    }

    switch (activeTab) {
      case Tab.DASHBOARD:
        return (
          <DashboardView
            onNavigateToQR={() => setActiveTab(Tab.QR_GENERATE)}
            onNavigateToInventory={() => setActiveTab(Tab.INVENTORY)}
            repairs={repairs}
          />
        );
      case Tab.WORK:
        return <WorkView />;
      case Tab.STOCK:
        return <JobBoardView repairs={repairs} onEditJob={(id) => setEditingRepairId(id)} />;
      case Tab.INVENTORY:
        return <InventoryView items={stockItems} onAddItem={handleAddStock} />;
      case Tab.QR_GENERATE:
        return <QRGenerateView />;
      case Tab.SEARCH:
        return <ScannerView onScan={handleScanSuccess} />;
      default:
        return (
          <DashboardView
            onNavigateToQR={() => setActiveTab(Tab.QR_GENERATE)}
            onNavigateToInventory={() => setActiveTab(Tab.INVENTORY)}
            repairs={repairs}
          />
        );
    }
  };

  const getFirmName = () => {
    if (currentFirmId === 'Nihalelectronics') return 'Nihal Electronics';
    if (currentFirmId === 'Yashelectronics') return 'Yash Electronics';
    return 'Repair Hub';
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={(tab) => {
        setEditingRepairId(null);
        setActiveTab(tab);
      }}
      isDarkMode={isDarkMode}
      toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      firmName={getFirmName()}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
