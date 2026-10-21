export type Dificultad = 'facil' | 'media' | 'dificil';

export type EstadoRuta = 'draft' | 'published' | 'archived';

export interface Location {
  _id: string;
  nombre: string;
  slug: string;
  provincia: string;
  comunidad: string;
  pais: string;
  geo: {
    type: string;
    coordinates: number[];
  };
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface Host {
  _id: string;
  name: string;
  slug: string;
  bio: string;
  contactEmail: string;
  phone: string;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  type: 'ruta';
  parentId: string | null;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface RutaImage {
  _id: string;
  url: string;
  alt: string;
  position: number;
  isCover: boolean;
  entityType: string;
  entityId: string;
}

export interface Ruta {
  _id: string;
  nombre: string;
  descripcion: string;
  dificultad: Dificultad;
  distanciaKm: number;
  desnivelM: number;
  duracionHoras: number;
  circular: boolean;
  hostId: Host | string;
  locationId: Location | string;
  categoryIds: Category[] | string[];
  coverImage: {
    url: string;
    alt: string;
  };
  images: RutaImage[];
  startPoint: {
    type: string;
    coordinates: number[];
  };
  gpxUrl: string;
  slug: string;
  isActive: boolean;
  status: EstadoRuta;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RutaInput {
  nombre: string;
  descripcion: string;
  dificultad: Dificultad;
  distanciaKm: number;
  desnivelM: number;
  duracionHoras: number;
  circular?: boolean;
  hostId?: string | null;
  locationId?: string;
  categoryIds?: string[];
  coverImage?: {
    url: string;
    alt: string;
  };
  images?: {
    url: string;
    alt?: string;
  }[];
  startPoint?: {
    type: string;
    coordinates: number[];
  };
  gpxUrl?: string;
  status?: EstadoRuta;
}

export interface RutasFiltros {
  dificultad?: Dificultad;
  provincia?: string;
  circular?: boolean;
  isActive?: boolean;
  status?: EstadoRuta;
}

export const DIFICULTADES: Dificultad[] = ['facil', 'media', 'dificil'];

export const ESTADOS: EstadoRuta[] = ['draft', 'published', 'archived'];

export const ETIQUETAS_DIFICULTAD: Record<Dificultad, string> = {
  facil: 'Fácil',
  media: 'Media',
  dificil: 'Difícil'
};

export const ETIQUETAS_ESTADO: Record<EstadoRuta, string> = {
  draft: 'Borrador',
  published: 'Publicada',
  archived: 'Archivada'
};
