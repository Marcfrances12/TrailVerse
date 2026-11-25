export type Sentimiento = 'positivo' | 'neutro' | 'negativo';

export interface ComentarioAutor {
  _id: string | null;
  nombre: string;
  avatarUrl: string | null;
}

/** Comentario tal como se muestra en el detalle de una ruta. */
export interface Comentario {
  _id: string;
  texto: string;
  valoracion: number;
  created_at: string;
  updated_at: string;
  editado: boolean;
  autor: ComentarioAutor;
  esMio: boolean;
}

export interface ComentarioEstadisticas {
  total: number;
  media: number | null;
  reparto: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ComentariosPagina {
  ok: boolean;
  data: Comentario[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  estadisticas: ComentarioEstadisticas;
  yaComentado: boolean;
}

/** Opinión del usuario actual, con la ruta en la que la escribió ("Mis opiniones"). */
export interface ComentarioPropio extends Comentario {
  ruta: { _id: string | null; nombre: string; slug: string | null; visible: boolean };
}

export interface ComentariosPropiosPagina {
  ok: boolean;
  data: ComentarioPropio[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ComentarioDatos {
  texto: string;
  valoracion: number;
}

export interface SentimientoComentario {
  etiqueta: Sentimiento;
  puntuacion: number;
  temas: string[];
  analizadoEn: string;
}

/** Comentario en la moderación del admin. */
export interface ComentarioAdmin extends Comentario {
  ruta: { _id: string | null; nombre: string; slug: string | null };
  sentimiento: SentimientoComentario | null;
  deleted_at: string | null;
  deletedBy: string | null;
}

export interface ComentariosAdminPagina {
  ok: boolean;
  data: ComentarioAdmin[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type EstadoComentariosAdmin = 'activos' | 'eliminados' | 'todos';

export interface FiltrosComentariosAdmin {
  page?: number;
  limit?: number;
  estado?: EstadoComentariosAdmin;
  sentimiento?: Sentimiento | 'pendiente' | '';
  q?: string;
  rutaId?: string;
}

export interface TemaFrecuente {
  tema: string;
  veces: number;
}

export interface PorcentajesSentimiento {
  positivo: number;
  neutro: number;
  negativo: number;
}

export interface SentimientoRuta {
  rutaId: string;
  nombre: string;
  slug: string;
  total: number;
  analizados: number;
  pendientes: number;
  media: number | null;
  positivos: number;
  neutros: number;
  negativos: number;
  porcentajes: PorcentajesSentimiento;
  puntuacionMedia: number | null;
  temas: TemaFrecuente[];
  ultimoComentario: string;
  alerta: boolean;
  motivosAlerta: string[];
}

export interface SentimientoResumen {
  global: {
    total: number;
    analizados: number;
    pendientes: number;
    media: number | null;
    porcentajes: PorcentajesSentimiento;
    rutasEnAlerta: number;
    temas: TemaFrecuente[];
  };
  rutas: SentimientoRuta[];
}

/** Resumen de valoración generado por el agente IA. */
export interface ValoracionIA {
  ruta: { id: string; nombre: string; slug: string };
  total: number;
  media: number | null;
  minimo: number;
  suficientes: boolean;
  resumen: string | null;
  positivos: string[];
  negativos: string[];
  basadoEn: number;
  generadoEn: string | null;
  disponible: boolean;
  aviso: string;
}
