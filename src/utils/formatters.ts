/**
 * Format numerical values into Angolan Kwanza currency (Kz)
 */
export function formatKz(amount: number): string {
  if (isNaN(amount)) return '0,00 Kz';
  
  const formatted = new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${formatted} Kz`;
}

/**
 * Format numbers without currency symbol
 */
export function formatNumber(val: number): string {
  return new Intl.NumberFormat('pt-AO').format(val);
}

/**
 * Format ISO date string into readable Portuguese date format (DD/MM/YYYY)
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format ISO date string into time (HH:mm)
 */
export function formatTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format ISO date string into date and time (DD/MM/YYYY HH:mm)
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Translate and style work order statuses
 */
export function getWorkOrderStatusConfig(status: string) {
  switch (status) {
    case 'completed':
      return { 
        label: 'Concluído', 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700', 
        border: 'border-emerald-200',
        dot: 'bg-emerald-500'
      };
    case 'in_progress':
    case 'diagnosing':
    case 'waiting_parts':
      return { 
        label: status === 'diagnosing' ? 'Em Diagnóstico' : status === 'waiting_parts' ? 'Aguardando Peças' : 'Em Andamento', 
        bg: 'bg-amber-50', 
        text: 'text-amber-700', 
        border: 'border-amber-200',
        dot: 'bg-amber-500'
      };
    case 'pending':
      return { 
        label: 'Pendente', 
        bg: 'bg-rose-50', 
        text: 'text-rose-700', 
        border: 'border-rose-200',
        dot: 'bg-rose-500'
      };
    case 'delivered':
      return { 
        label: 'Entregue', 
        bg: 'bg-zinc-100', 
        text: 'text-zinc-700', 
        border: 'border-zinc-200',
        dot: 'bg-zinc-500'
      };
    case 'canceled':
      return { 
        label: 'Cancelada', 
        bg: 'bg-zinc-100', 
        text: 'text-zinc-500', 
        border: 'border-zinc-200',
        dot: 'bg-zinc-400'
      };
    default:
      return { 
        label: status, 
        bg: 'bg-zinc-50', 
        text: 'text-zinc-700', 
        border: 'border-zinc-200',
        dot: 'bg-zinc-400'
      };
  }
}

/**
 * Translate and style work order priority
 */
export function getPriorityConfig(priority: string) {
  switch (priority) {
    case 'urgent':
      return { label: 'Urgente', bg: 'bg-rose-500', text: 'text-white' };
    case 'high':
      return { label: 'Alta', bg: 'bg-amber-500', text: 'text-white' };
    case 'normal':
      return { label: 'Normal', bg: 'bg-slate-200', text: 'text-slate-700' };
    case 'low':
      return { label: 'Baixa', bg: 'bg-slate-100', text: 'text-slate-500' };
    default:
      return { label: priority, bg: 'bg-slate-200', text: 'text-slate-700' };
  }
}
