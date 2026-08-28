import { Product, WorkOrder, Customer, SaleTransaction, CompanySettings, UserSession, Expense, CashSession, CashMovement } from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_WORK_ORDERS, 
  INITIAL_CUSTOMERS, 
  INITIAL_SALES, 
  INITIAL_SETTINGS,
  INITIAL_EXPENSES,
  INITIAL_CASH_SESSION,
  INITIAL_CASH_MOVEMENTS
} from '../data/mockData';

const STORAGE_KEYS = {
  PRODUCTS: 'masakula_products',
  WORK_ORDERS: 'masakula_orders',
  CUSTOMERS: 'masakula_customers',
  SALES: 'masakula_sales',
  EXPENSES: 'masakula_expenses',
  CASH_SESSION: 'masakula_cash_session',
  CASH_MOVEMENTS: 'masakula_cash_movements',
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

export function loadStoredExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar despesas do localStorage:', err);
  }
  return INITIAL_EXPENSES;
}

export function saveStoredExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  } catch (err) {
    console.warn('Erro ao salvar despesas no localStorage:', err);
  }
}

export function loadStoredCashSession(): CashSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CASH_SESSION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.status === 'OPEN') return parsed;
      if (parsed && typeof parsed === 'object' && parsed.status === 'CLOSED') return null;
    }
  } catch (err) {
    console.warn('Erro ao carregar sessão de caixa do localStorage:', err);
  }
  return INITIAL_CASH_SESSION;
}

export function saveStoredCashSession(session: CashSession | null): void {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.CASH_SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CASH_SESSION);
    }
  } catch (err) {
    console.warn('Erro ao salvar sessão de caixa no localStorage:', err);
  }
}

export function loadStoredCashMovements(): CashMovement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CASH_MOVEMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar movimentos de caixa do localStorage:', err);
  }
  return INITIAL_CASH_MOVEMENTS;
}

export function saveStoredCashMovements(movements: CashMovement[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CASH_MOVEMENTS, JSON.stringify(movements));
  } catch (err) {
    console.warn('Erro ao salvar movimentos de caixa no localStorage:', err);
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
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.CASH_SESSION);
    localStorage.removeItem(STORAGE_KEYS.CASH_MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  } catch (err) {
    console.warn('Erro ao resetar dados:', err);
  }
}
