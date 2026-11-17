import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { GuiaRuta } from '../models/guia.model';

export class AgentGuiaError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'AgentGuiaError';
  }
}

const MENSAJE_GENERICO = 'No se ha podido cargar la guía de la ruta.';

// Cliente de la guía de la ruta (trailverse-agent). Lee datos ya generados por IA.
@Injectable({ providedIn: 'root' })
export class AgentGuiaService {
  private readonly base = `${environment.AGENT_URL}/rutas`;

  async obtener(rutaId: string, signal?: AbortSignal): Promise<GuiaRuta> {
    const tiempo = AbortSignal.timeout(environment.TIMEOUT_MS);
    const respuesta = await fetch(`${this.base}/${encodeURIComponent(rutaId)}/guia`, {
      headers: { Accept: 'application/json' },
      signal: signal ? AbortSignal.any([signal, tiempo]) : tiempo
    });

    const cuerpo = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
      throw new AgentGuiaError(cuerpo?.error ?? MENSAJE_GENERICO);
    }

    return cuerpo.data as GuiaRuta;
  }
}
