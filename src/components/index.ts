// Main System Export
export { MasakulaSystem, default } from '../App';
export { AnimatedIcon, type AnimationType } from './AnimatedIcon';

// Layout Submodules
export { Sidebar } from './layout/Sidebar';
export { Header as LayoutHeader } from './layout/Header';
export { Header, default as MasakulaHeader } from './Header';
export { AppShell } from './layout/AppShell';
export { NotificationsCenter } from './NotificationsCenter';

// Auth Submodules
export { LoginModal, AuthView } from './auth/AuthView';
export { RoleGuard } from './RoleGuard';

// View Submodules & Modals
export { ProductsView } from './views/ProductsView';
export { default as ProductsPage, ProductsPage as MasakulaProductsPage } from '../screens/ProductsPage';
export { StockModal } from './views/StockModal';
export { ServiceOrdersView, WorkOrdersView } from './views/ServiceOrdersView';
export { PosView } from './views/PosView';
export { ThermalReceipt } from './ThermalReceipt';
export { CustomersView } from './views/CustomersView';
export { ReportsView } from './views/ReportsView';
export { default as ReportsScreen } from './ReportsScreen';
export { default as VoidSaleModal } from './VoidSaleModal';
export { default as SaleFeedbackModal } from './SaleFeedbackModal';
export { default as ReportZModal, type ReportZData } from './ReportZModal';
export { default as ProductLabelPrintModal, type ProductLabelData } from './ProductLabelPrintModal';
export { default as CrossSellBanner, type SuggestedProduct, type CrossSellBannerProps } from './CrossSellBanner';
export { default as BusinessIntelligenceScreen, BusinessIntelligenceScreen as MasakulaIntelligence } from './BusinessIntelligenceScreen';
export { default as DeadStockDetectorSection, DeadStockDetectorSection as DeadStockDetector } from './DeadStockDetectorSection';
export { default as PriceSimulatorScreen, PriceSimulatorScreen as PriceSimulator } from './PriceSimulatorScreen';
export { default as AuditAndSecurityScreen, AuditAndSecurityScreen as AuditAndSecurity, type AuditLog } from './AuditAndSecurityScreen';
export { generateIntelligencePDF, type IntelligenceReportData } from '../utils/exportPdf';
export { useDeadStock, type DeadStockItem } from '../hooks/useDeadStock';
export { usePermissions, type UserRole as PermissionsUserRole, type UserProfile as PermissionsUserProfile } from '../hooks/usePermissions';
export { SettingsView } from './views/SettingsView';
export { DashboardView } from './views/DashboardView';

// Intro Submodules


// Supabase Instance & Services
export { supabase } from '../lib/supabase';
export { supabaseService } from '../services/supabaseService';
export { productService } from '../services/productService';
export { tauriHardwareService, isTauriEnvironment } from '../services/tauriHardwareService';
export type { SerialPortInfo, SerialResponse, PrintReceiptOptions } from '../services/tauriHardwareService';
export { HardwareService, ESCPOSBuilder } from '../services/hardwareService';
export type { ReceiptItem, ReceiptData } from '../services/hardwareService';
export { GET as getProductsRoute, POST as createProductRoute, expressHandlers as productExpressHandlers } from '../api/products';
export { GET as getSaftRoute, expressSaftHandler } from '../api/saft';

// Custom & Lucide Icon Barrel
export * from './icons';

// Inventory & Stock Domain Types
export type {
  ProductType,
  StockUnit,
  MovementType,
  AgtTaxRate,
  Category,
  Supplier,
  ProductBatch,
  Product as InventoryProduct,
  CreateProductDTO,
  ProductFilterParams
} from '../types/inventory';

// SAF-T (AO) Domain Types & XML Generator
export { SaftAOXmlBuilder } from '../services/saftXmlBuilder';
export type {
  SaftCompanyHeader,
  SaftCustomer,
  SaftProduct,
  SaftInvoiceLine,
  SaftInvoice
} from '../types/saft';

// Offline Sales & Sync Engine
export { OfflineStorage } from '../services/offlineStorage';
export type { OfflineSale } from '../services/offlineStorage';
export { SyncManager } from '../services/syncManager';
export type { SyncCallback } from '../services/syncManager';

