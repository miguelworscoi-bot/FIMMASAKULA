import { supabase } from '../lib/supabase';
import { Product, WorkOrder, SaleTransaction } from '../types';
import { INITIAL_PRODUCTS, INITIAL_WORK_ORDERS, INITIAL_SALES } from '../data/mockData';

export interface SupabaseProductRow {
  id?: string;
  barcode?: string;
  name: string;
  category?: string;
  sales_type?: string;
  cost?: string;
  price?: string;
  sku?: string;
  cost_price?: number;
  sale_price?: number;
  stock?: number;
  min_stock?: number;
  unit?: string;
  status?: string;
  created_at?: string;
}

export interface SupabaseServiceOrderRow {
  id?: string;
  code?: string;
  client?: string;
  customer_phone?: string;
  device_service?: string;
  status?: 'Pendente' | 'Em Andamento' | 'Concluído' | string;
  date?: string;
  total?: string;
  created_at?: string;
}

// Convert Supabase row to Product model
export function mapSupabaseToProduct(row: any): Product {
  const parseKz = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const cost = row.cost_price ?? parseKz(row.cost);
  const price = row.sale_price ?? parseKz(row.price);

  return {
    id: String(row.id || `prod-${Date.now()}`),
    name: row.name || 'Produto Sem Nome',
    sku: row.sku || `MSK-${row.id?.slice(0, 5) || Math.floor(1000 + Math.random() * 9000)}`,
    barcode: row.barcode || `560${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    category: row.category || 'Alimentação',
    saleType: row.sales_type || row.saleType || 'Unidade',
    costPrice: cost,
    salePrice: price,
    stock: typeof row.stock === 'number' ? row.stock : 25,
    minStock: typeof row.min_stock === 'number' ? row.min_stock : 5,
    unit: row.unit || 'un',
    status: (row.status as any) || (cost > 0 && price > 0 ? 'active' : 'draft'),
    updatedAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

// Convert Product model to Supabase payload
export function mapProductToSupabase(p: Partial<Product>): SupabaseProductRow {
  return {
    barcode: p.barcode || Math.floor(1000000000000 + Math.random() * 9000000000000).toString(),
    name: p.name || '',
    category: p.category || 'Alimentação',
    sales_type: p.saleType || 'Unidade',
    cost: `${p.costPrice || 0} Kz`,
    price: `${p.salePrice || 0} Kz`,
    cost_price: p.costPrice || 0,
    sale_price: p.salePrice || 0,
    stock: p.stock ?? 25,
    min_stock: p.minStock ?? 5,
    sku: p.sku || `MSK-${Math.floor(1000 + Math.random() * 9000)}`,
    unit: p.unit || 'un',
    status: p.status || 'active',
  };
}

// Convert Supabase row to WorkOrder model
export function mapSupabaseToWorkOrder(row: any): WorkOrder {
  const parseKz = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const total = parseKz(row.total);
  const statusMap: Record<string, 'pending' | 'in_progress' | 'completed'> = {
    'Pendente': 'pending',
    'Em Andamento': 'in_progress',
    'Concluído': 'completed',
    'pending': 'pending',
    'in_progress': 'in_progress',
    'completed': 'completed',
  };

  return {
    id: String(row.id || `os-${Date.now()}`),
    code: row.code || `OS-2026-${Math.floor(100 + Math.random() * 900)}`,
    customerName: row.client || row.customerName || 'Cliente Particular',
    customerPhone: row.customer_phone || row.customerPhone || '+244 923 000 000',
    equipment: row.device_service || row.equipment || 'Equipamento em Reparação',
    reportedDefect: row.reportedDefect || row.device_service || 'Anomalia técnica',
    technician: row.technician || 'Técnico Especialista',
    status: statusMap[row.status] || 'in_progress',
    priority: row.priority || 'normal',
    partsCost: total > 0 ? Math.round(total * 0.4) : 0,
    laborCost: total > 0 ? Math.round(total * 0.6) : 0,
    totalCost: total,
    createdAt: row.date || row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    estimatedDelivery: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
  };
}

// Convert WorkOrder model to Supabase payload
export function mapWorkOrderToSupabase(wo: Partial<WorkOrder>): SupabaseServiceOrderRow {
  const statusDisplay = 
    wo.status === 'completed' || wo.status === 'delivered' ? 'Concluído' :
    wo.status === 'in_progress' || wo.status === 'diagnosing' || wo.status === 'waiting_parts' ? 'Em Andamento' :
    'Pendente';

  return {
    code: wo.code || `OS-2026-${Math.floor(100 + Math.random() * 900)}`,
    client: wo.customerName || 'Cliente Particular',
    customer_phone: wo.customerPhone || '',
    device_service: `${wo.equipment || 'Equipamento'} - ${wo.reportedDefect || 'Serviço'}`,
    status: statusDisplay,
    date: wo.createdAt || new Date().toISOString().split('T')[0],
    total: `${wo.totalCost || 0} Kz`,
  };
}

// Supabase API Operations with resilient Fallback
export const supabaseService = {
  async getProducts(): Promise<{ data: Product[]; fromSupabase: boolean }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return { data: data.map(mapSupabaseToProduct), fromSupabase: true };
      }
    } catch (err) {
      console.warn('Supabase fetch products notice (using local data):', err);
    }
    return { data: INITIAL_PRODUCTS, fromSupabase: false };
  },

  async insertProduct(product: Partial<Product>): Promise<{ success: boolean; data?: Product; error?: any }> {
    const payload = mapProductToSupabase(product);
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select();

      if (!error && data && data.length > 0) {
        return { success: true, data: mapSupabaseToProduct(data[0]) };
      }
      if (error) {
        console.warn('Supabase insert warning:', error.message);
      }
    } catch (err) {
      console.warn('Supabase insert exception:', err);
    }
    // Fallback: Return locally formatted product
    const localProduct = mapSupabaseToProduct({ ...payload, id: `prod-${Date.now()}` });
    return { success: false, data: localProduct };
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      return !error;
    } catch (err) {
      console.warn('Supabase delete product notice:', err);
      return false;
    }
  },

  async getServiceOrders(): Promise<{ data: WorkOrder[]; fromSupabase: boolean }> {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return { data: data.map(mapSupabaseToWorkOrder), fromSupabase: true };
      }
    } catch (err) {
      console.warn('Supabase fetch service orders notice (using local data):', err);
    }
    return { data: INITIAL_WORK_ORDERS, fromSupabase: false };
  },

  async insertServiceOrder(order: Partial<WorkOrder>): Promise<{ success: boolean; data?: WorkOrder }> {
    const payload = mapWorkOrderToSupabase(order);
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .insert([payload])
        .select();

      if (!error && data && data.length > 0) {
        return { success: true, data: mapSupabaseToWorkOrder(data[0]) };
      }
    } catch (err) {
      console.warn('Supabase insert service order notice:', err);
    }
    const localOrder = mapSupabaseToWorkOrder({ ...payload, id: `os-${Date.now()}` });
    return { success: false, data: localOrder };
  },

  async getSales(): Promise<{ data: SaleTransaction[]; fromSupabase: boolean }> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return {
          data: data.map((row: any) => ({
            id: String(row.id || `sale-${Date.now()}`),
            invoiceNumber: row.invoice_number || row.invoiceNumber || `FT MAS26/${Math.floor(1000 + Math.random() * 9000)}`,
            customerName: row.customer_name || row.customerName || 'Consumidor Final',
            customerNif: row.customer_nif || row.customerNif || undefined,
            items: Array.isArray(row.items) ? row.items : [],
            subtotal: typeof row.subtotal === 'number' ? row.subtotal : parseFloat(String(row.subtotal).replace(/[^0-9.]/g, '')) || 0,
            discount: typeof row.discount === 'number' ? row.discount : 0,
            tax: typeof row.tax === 'number' ? row.tax : 0,
            total: typeof row.total === 'number' ? row.total : parseFloat(String(row.total).replace(/[^0-9.]/g, '')) || 0,
            paymentMethod: row.payment_method || row.paymentMethod || 'cash',
            cashierName: row.cashier_name || row.cashierName || 'Operador de Caixa',
            createdAt: row.created_at || new Date().toISOString(),
            status: row.status || 'paid',
          })),
          fromSupabase: true
        };
      }
    } catch (err) {
      console.warn('Supabase fetch sales notice (using local data):', err);
    }
    return { data: INITIAL_SALES, fromSupabase: false };
  },

  async insertSale(sale: SaleTransaction, additionalInfo?: { amountPaid?: number; changeGiven?: number }): Promise<{ success: boolean; data?: SaleTransaction }> {
    try {
      const paid = additionalInfo?.amountPaid ?? sale.total;
      const change = additionalInfo?.changeGiven ?? Math.max(0, paid - sale.total);

      const payload = {
        invoice_number: sale.invoiceNumber,
        customer_name: sale.customerName,
        customer_nif: sale.customerNif || null,
        items: sale.items,
        subtotal: sale.subtotal,
        discount: sale.discount,
        tax: sale.tax,
        total: `${sale.total} Kz`,
        payment_method: sale.paymentMethod === 'cash' ? 'Dinheiro' : sale.paymentMethod === 'multicaixa' ? 'TPA / Multicaixa' : sale.paymentMethod,
        cashier_name: sale.cashierName,
        status: sale.status,
        amount_paid: `${paid} Kz`,
        change_given: `${change} Kz`,
        created_at: sale.createdAt,
      };

      const { data, error } = await supabase
        .from('sales')
        .insert([payload])
        .select();

      if (!error && data && data.length > 0) {
        const saleRecord = data[0];
        
        // Also insert detailed sale items if sale_items table is used
        try {
          const saleItems = sale.items.map((item) => ({
            sale_id: saleRecord.id || sale.id,
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: `${item.product.salePrice} Kz`,
            subtotal: `${item.product.salePrice * item.quantity} Kz`,
          }));

          await supabase.from('sale_items').insert(saleItems);
        } catch {
          // Non-blocking if sale_items doesn't exist
        }

        return { success: true, data: sale };
      }
    } catch (err) {
      console.warn('Supabase insert sale notice:', err);
    }
    return { success: false, data: sale };
  },

  async updateProductStock(productId: string, newStock: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          stock: newStock,
          status: newStock === 0 ? 'out_of_stock' : newStock <= 5 ? 'low_stock' : 'active'
        })
        .eq('id', productId);
      return !error;
    } catch (err) {
      console.warn('Supabase update stock notice:', err);
      return false;
    }
  },
};
