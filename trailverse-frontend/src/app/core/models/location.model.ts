export interface Location {
  _id: string;
  nombre: string;
  slug: string;
  provincia: string;
  comunidad: string;
  pais: string;
  geo?: {
    type: 'Point';
    coordinates: [number, number];
  };
  isActive: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationInput {
  nombre: string;
  provincia: string;
  comunidad: string;
  pais?: string;
  geo?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface LocationsFiltros {
  provincia?: string;
}
