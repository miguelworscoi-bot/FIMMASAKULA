import { supabase } from '../lib/supabase';

export interface DailyClosingReportItem {
  operator_id: string;
  operator_name: string;
  payment_method: 'cash' | 'multicaixa' | 'transfer' | string;
  total_transactions: number;
  total_sales: number;
  average_ticket: number;
  [key: string]: any;
}

export async function fetchDailyClosingReport(startDate?: Date, endDate?: Date): Promise<DailyClosingReportItem[] | any> {
  // Define o início e o fim do dia atual (ISO String) se não fornecidos
  const start = startDate ? new Date(startDate) : new Date();
  if (!startDate) {
    start.setHours(0, 0, 0, 0);
  }

  const end = endDate ? new Date(endDate) : new Date();
  if (!endDate) {
    end.setHours(23, 59, 59, 999);
  }

  try {
    const { data, error } = await supabase.rpc("get_cash_closing_report", {
      p_start_date: start.toISOString(),
      p_end_date: end.toISOString(),
    });

    if (error) {
      console.error("Erro ao gerar fecho de caixa via RPC:", error);
      
      // Fallback gracioso: consultar a tabela sales caso a RPC ainda não esteja provisionada
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (salesError) {
        console.error("Erro no fallback de vendas do dia:", salesError);
        return [];
      }

      return salesData || [];
    }

    return data || [];
  } catch (err) {
    console.error("Exceção ao obter relatório diário de fecho de caixa:", err);
    return [];
  }
}

export default fetchDailyClosingReport;
