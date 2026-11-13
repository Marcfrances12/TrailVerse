import { Dificultad } from './ruta.model';

export type CategoryMode = 'any' | 'all';

export type SortCampo = 'nombre' | 'created_at' | 'distanciaKm' | 'duracionHoras';

export type SortValor = SortCampo | `-${SortCampo}`;

export interface ShopFiltros {
  q: string;
  categoryId: string[];
  categoryMode: CategoryMode;
  hostId: string;
  locationId: string;
  dificultad: Dificultad | '';
  precioMin: number;
  precioMax: number;
  sort: SortValor;
  page: number;
  limit: number;
}

export interface ShopImagen {
  url: string;
  alt: string;
}

export interface ShopEntidad {
  _id: string;
  nombre: string;
  slug: string;
  total?: number;
  imagen?: ShopImagen | null;
}

export interface ShopFiltrosOpciones {
  dificultades: Dificultad[];
  categoryModes: CategoryMode[];
  sort: SortValor[];
  categories: ShopEntidad[];
  hosts: ShopEntidad[];
  locations: ShopEntidad[];
}

export interface ShopHome {
  categories: ShopEntidad[];
  hosts: ShopEntidad[];
  locations: ShopEntidad[];
}

export interface ShopPrecio {
  amount: number;
  currency: string;
}

export interface ShopRuta {
  _id: string;
  nombre: string;
  slug: string;
  dificultad: Dificultad;
  distanciaKm: number;
  desnivelM: number;
  duracionHoras: number;
  circular: boolean;
  locationId: { _id: string; nombre: string; slug: string; provincia: string; comunidad: string } | null;
  hostId: { _id: string; name: string; slug: string } | null;
  categoryIds: { _id: string; name: string; slug: string }[];
  coverImage: { url: string; alt: string };
  precioDesde: ShopPrecio | null;
}

export interface ShopRutaImagen {
  url: string;
  alt: string;
}

export interface ShopRutaDetalle extends Omit<ShopRuta, 'precioDesde' | 'locationId' | 'categoryIds'> {
  locationId: (NonNullable<ShopRuta['locationId']> & { imagen?: ShopImagen | null }) | null;
  categoryIds: { _id: string; name: string; slug: string; imagen?: ShopImagen | null }[];
  descripcion: string;
  gpxUrl: string;
  images: ShopRutaImagen[];
}

export interface ShopSalida {
  _id: string;
  startDate: string;
  endDate: string | null;
  meetingPoint: string;
  price: ShopPrecio;
  capacity: number;
  stock: number;
  status: 'open' | 'full' | 'cancelled';
}

export interface ShopListaRespuesta {
  ok: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: ShopRuta[];
}
