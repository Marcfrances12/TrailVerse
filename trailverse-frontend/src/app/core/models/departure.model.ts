export type DepartureStatus = 'open' | 'full' | 'cancelled';

export interface Departure {
  _id: string;
  rutaId: string | { _id: string; nombre: string; slug: string };
  sku: string;
  startDate: string;
  endDate: string | null;
  meetingPoint: string;
  price: { amount: number; currency: string };
  capacity: number;
  stock: number;
  status: DepartureStatus;
  isActive: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DepartureInput {
  rutaId: string;
  startDate: string;
  endDate?: string | null;
  meetingPoint: string;
  price: { amount: number; currency: string };
  capacity: number;
  stock: number;
  status?: DepartureStatus;
}

export interface DeparturesFiltros {
  rutaId?: string;
  status?: string;
  isActive?: boolean;
}

export const ESTATUSES = [
  { valor: 'open', etiqueta: 'Abierta' },
  { valor: 'full', etiqueta: 'Completa' },
  { valor: 'cancelled', etiqueta: 'Cancelada' }
] as const;
