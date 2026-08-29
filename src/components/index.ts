// Main System Export
export { MasakulaSystem, default } from '../App';

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
export { generateIntelligencePDF, type IntelligenceReportData } from '../utils/exportPdf';
export { useDeadStock, type DeadStockItem } from '../hooks/useDeadStock';
export { SettingsView } from './views/SettingsView';
export { DashboardView } from './views/DashboardView';

// Intro Submodules
export { SplashOne } from './intro/SplashOne';
export { SplashTwo } from './intro/SplashTwo';
export { OnboardingView } from './intro/OnboardingView';

// Supabase Instance & Services
export { supabase } from '../lib/supabase';
export { supabaseService } from '../services/supabaseService';
