export type Dificultad = 'facil' | 'media' | 'dificil';

export type EstadoRuta = 'draft' | 'published' | 'archived';

export interface Ruta {
  _id: string;
  nombre: string;
  descripcion: string;
  dificultad: Dificultad;
  distanciaKm: number;
  desnivelM: number;
  duracionHoras: number;
  ubicacion: string;
  provincia: string;
  circular: boolean;
  imagen: string;
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
  ubicacion: string;
  provincia: string;
  circular?: boolean;
  imagen?: string;
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
