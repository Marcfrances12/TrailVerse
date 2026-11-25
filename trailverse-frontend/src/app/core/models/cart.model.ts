import { ShopImagen } from './shop.model';

/** Línea del carrito: una salida y cuántas plazas. El precio lo calcula el servidor. */
export interface CartItem {
  _id: string;
  departureId: string;
  quantity: number;
  price: number;
  currency: 'EUR';
  subtotal: number;
  /** false si la salida se ha cancelado, ha pasado o ya no tiene plazas suficientes. */
  disponible: boolean;
  motivo: string | null;
  salida: {
    startDate: string;
    endDate: string | null;
    meetingPoint: string;
    stock: number;
  };
  ruta: {
    _id: string;
    nombre: string;
    slug: string;
    coverImage: ShopImagen;
  } | null;
}

export interface Cart {
  items: CartItem[];
  total: number;
  total_items: number;
  currency: 'EUR';
}

export const CARRITO_VACIO: Cart = { items: [], total: 0, total_items: 0, currency: 'EUR' };
