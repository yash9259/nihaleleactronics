
import React from 'react';

export type RepairStatus = 'quoted' | 'approved' | 'working' | 'completed';

export interface RepairRecord {
  id: string;
  customerName: string;
  contactNumber: string;
  address: string;
  product: string;
  issue: string;
  status: RepairStatus;
  dateAdded: string;
  updatedAt: string;
  estimatedCost?: number;
  devicePhotoUrl?: string; // New field for photo evidence
  partsUsed?: UsedPart[];
}

export interface UsedPart {
  id: string;
  stockItemId: string;
  name: string;
  quantity: number;
  cost: number;
  dateUsed: string;
}

export interface StatData {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
}

export interface Activity {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  statusColor: string;
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  lastUpdated: string;
}

export enum Tab {
  DASHBOARD = 'dashboard',
  WORK = 'work',
  SEARCH = 'search',
  STOCK = 'stock', // Used for Job Board/Work
  INVENTORY = 'inventory', // New Stock Page
  QR_GENERATE = 'qr_generate'
}
