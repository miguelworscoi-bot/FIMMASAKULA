import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface DeadStockItem {
  product_id: string;
  product_name: string;
  barcode: string;
  stock_quantity: number;
  cost_price: number;
  sale_price: number;
  capital_locked: number;
  last_activity_date: string;
  days_inactive: number;
  suggested_action: 'LIQUIDATION' | 'COMBO' | 'DISCOUNT_15';
}

const FALLBACK_DEAD_STOCK: DeadStockItem[] = [
  {
    product_id: 'prod-ds-1',
    product_name: 'Óleo de Palma 1L',
    barcode: '560123456701',
    stock_quantity: 45,
    cost_price: 1200,
    sale_price: 1600,
    capital_locked: 54000,
    last_activity_date: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(),
    days_inactive: 42,
    suggested_action: 'DISCOUNT_15',
  },
  {
    product_id: 'prod-ds-2',
    product_name: 'Detergente em Pó 500g',
    barcode: '560123456702',
    stock_quantity: 20,
    cost_price: 4500,
    sale_price: 5200,
    capital_locked: 90000,
    last_activity_date: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString(),
    days_inactive: 58,
    suggested_action: 'COMBO',
  },
  {
    product_id: 'prod-ds-3',
    product_name: 'Arroz Agulha 5kg Extra',
    barcode: '560123456703',
    stock_quantity: 28,
    cost_price: 12000,
    sale_price: 14500,
    capital_locked: 336000,
    last_activity_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    days_inactive: 35,
    suggested_action: 'LIQUIDATION',
  },
];

export function useDeadStock() {
  const [items, setItems] = useState<DeadStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeadStock = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('view_dead_stock_analysis')
        .select('*');

      if (!error && data && data.length > 0) {
        setItems(data as DeadStockItem[]);
      } else {
        setItems(FALLBACK_DEAD_STOCK);
      }
    } catch (err) {
      console.warn('Usando dados de estoque de segurança locais:', err);
      setItems(FALLBACK_DEAD_STOCK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadStock();
  }, []);

  const totalCapitalLocked = items.reduce((sum, item) => sum + (item.capital_locked || 0), 0);

  return { items, totalCapitalLocked, loading, refresh: fetchDeadStock };
}
