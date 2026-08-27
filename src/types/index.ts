export type AppFlowState = 
  | 'SPLASH_1'
  | 'SPLASH_2'
  | 'ONBOARDING'
  | 'LOGIN'
  | 'APP_SHELL';

export type FlowStep = AppFlowState;

export interface UserSession {
  email: string;
  name: string;
  role: string;
  terminalId: string;
  isLoggedIn: boolean;
}

export type ActiveTab = 
  | 'dashboard'
  | 'products'
  | 'service_orders'
  | 'sales'
  | 'customers'
  | 'reports'
  | 'settings';

export type NavigationTab = 
  | ActiveTab
  | 'services'
  | 'pos';

export interface NavItemConfig {
  id: ActiveTab;
  label: string;
  shortLabel: string;
  iconName: string;
  badge?: number | string;
  badgeColor?: 'red' | 'green' | 'blue' | 'amber';
  tooltip: string;
  isPinnedBottom?: boolean;
}

export type ProductStatus = 'active' | 'low_stock' | 'out_of_stock' | 'draft';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  saleType?: string;
  costPrice: number; // in Kz
  salePrice: number; // in Kz
  stock: number;
  minStock: number;
  unit: string;
  status: ProductStatus;
  imageUrl?: string;
  updatedAt: string;
}

export type WorkOrderStatus = 
  | 'pending'
  | 'diagnosing'
  | 'waiting_parts'
  | 'in_progress'
  | 'completed'
  | 'delivered'
  | 'canceled';

export type WorkOrderPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface WorkOrder {
  id: string;
  code: string; // e.g. OS-2026-089
  customerName: string;
  customerPhone: string;
  equipment: string;
  serialNumber?: string;
  reportedDefect: string;
  diagnosis?: string;
  technician: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  partsCost: number; // in Kz
  laborCost: number; // in Kz
  totalCost: number; // in Kz
  createdAt: string;
  estimatedDelivery: string;
}

export interface Customer {
  id: string;
  name: string;
  nifOrBi: string;
  email: string;
  phone: string;
  city: string;
  totalOrders: number;
  totalSpent: number; // in Kz
  status: 'active' | 'inactive';
  lastPurchaseDate: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent?: number;
}

export type PaymentMethod = 
  | 'multicaixa' // TPA / Multicaixa
  | 'cash' // Dinheiro
  | 'transfer' // Transferência Bancária / Express
  | 'mixed'; // Misto

export interface SaleTransaction {
  id: string;
  invoiceNumber: string; // FT 2026/0012
  customerName: string;
  customerNif?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number; // IVA (e.g. 14% or 0% / Isento)
  total: number; // in Kz
  paymentMethod: PaymentMethod;
  cashierName: string;
  createdAt: string;
  status: 'paid' | 'pending' | 'canceled';
}

export interface CompanySettings {
  companyName: string;
  tradingName: string;
  nif: string;
  regimeIva: 'Regime Geral (14%)' | 'Regime Simplificado (7%)' | 'Regime de Exclusão (0%)';
  phone: string;
  email: string;
  address: string;
  city: string;
  agtCertificateNumber: string;
  posTerminalId: string;
  defaultCurrency: 'Kz' | 'USD' | 'EUR';
  printReceiptOnCheckout: boolean;
  allowNegativeStock: boolean;
  soundAlerts: boolean;
}
