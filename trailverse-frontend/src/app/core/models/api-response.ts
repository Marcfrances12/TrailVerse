export interface DetalleValidacion {
  origen?: string;
  campo: string;
  mensaje: string;
}

/** Respuesta de listados: { ok, total, data } */
export interface ListaRespuesta<T> {
  ok: boolean;
  total: number;
  data: T[];
}

/** Respuesta de un recurso: { ok, data, message? } */
export interface RecursoRespuesta<T> {
  ok: boolean;
  message?: string;
  data: T;
}

/** Respuesta de error: { ok: false, error, details? } */
export interface ErrorRespuesta {
  ok: false;
  error: string;
  details?: (DetalleValidacion | string)[];
}
