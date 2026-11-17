export interface GuiaConsejo {
  pregunta: string;
  respuesta: string;
}

export interface GuiaLugar {
  nombre: string | null;
  tipo: string;
  distanciaM: number;
  lat: number;
  lng: number;
}

export type GuiaCategoria = 'restaurant' | 'lodging' | 'transport' | 'parking';

export interface GuiaGrupoLugares {
  categoria: GuiaCategoria;
  etiqueta: string;
  radioM: number;
  resultados: GuiaLugar[];
}

export interface GuiaRuta {
  ruta: { id: string; nombre: string; slug: string };
  inicio: { lat: number; lng: number } | null;
  consejos: GuiaConsejo[];
  pendiente: boolean;
  generadaEn: string | null;
  lugares: GuiaGrupoLugares[];
  resumen: string | null;
  fuentes: { lugares: string; resumen: string };
  aviso: string;
}
