export type MovementType = "SANGRIA" | "REFORCO";

export interface CashMovement {
  id: string;
  type: MovementType;
  amount: number;
  reason: string;
  timestamp: string;
  operatorName: string;
}

export interface ShiftRecord {
  id: string;
  operatorName: string;
  terminalId: string;
  openedAt: string;
  closedAt: string | null;
  status: "OPEN" | "CLOSED";
  initialCash: number;
  salesCash: number;
  salesCard: number; // Multicaixa / TPA
  totalSangria: number;
  totalReforco: number;
  expectedCash: number;
  actualCash: number | null;
  difference: number | null; // Quebra (negativo) ou Sobra (positivo)
  movements: CashMovement[];
}
