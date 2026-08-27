import { Product, WorkOrder, Customer, SaleTransaction, CompanySettings, UserSession } from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_WORK_ORDERS, 
  INITIAL_CUSTOMERS, 
  INITIAL_SALES, 
  INITIAL_SETTINGS 
} from '../data/mockData';

const STORAGE_KEYS = {
  PRODUCTS: 'masakula_products',
  WORK_ORDERS: 'masakula_orders',
  CUSTOMERS: 'masakula_customers',
  SALES: 'masakula_sales',
  SETTINGS: 'masakula_settings',
  USER_SESSION: 'masakula_user_session',
  FLOW_STATE: 'masakula_app_flow_state',
} as const;

export function loadStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS) || localStorage.getItem('masakula_products_db_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar produtos do localStorage:', err);
  }
  return INITIAL_PRODUCTS;
}

export function saveStoredProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (err) {
    console.warn('Erro ao salvar produtos no localStorage:', err);
  }
}

export function loadStoredWorkOrders(): WorkOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORK_ORDERS) || localStorage.getItem('masakula_work_orders_db_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar Ordens de Serviço do localStorage:', err);
  }
  return INITIAL_WORK_ORDERS;
}

export function saveStoredWorkOrders(workOrders: WorkOrder[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WORK_ORDERS, JSON.stringify(workOrders));
  } catch (err) {
    console.warn('Erro ao salvar Ordens de Serviço no localStorage:', err);
  }
}

export function loadStoredCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar clientes do localStorage:', err);
  }
  return INITIAL_CUSTOMERS;
}

export function saveStoredCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch (err) {
    console.warn('Erro ao salvar clientes no localStorage:', err);
  }
}

export function loadStoredSales(): SaleTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar vendas do localStorage:', err);
  }
  return INITIAL_SALES;
}

export function saveStoredSales(sales: SaleTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  } catch (err) {
    console.warn('Erro ao salvar vendas no localStorage:', err);
  }
}

export function loadStoredSettings(): CompanySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar configurações do localStorage:', err);
  }
  return INITIAL_SETTINGS;
}

export function saveStoredSettings(settings: CompanySettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn('Erro ao salvar configurações no localStorage:', err);
  }
}

export function resetToDemoData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.WORK_ORDERS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  } catch (err) {
    console.warn('Erro ao resetar dados:', err);
  }
}
