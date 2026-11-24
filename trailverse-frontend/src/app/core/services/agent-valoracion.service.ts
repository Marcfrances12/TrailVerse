import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { ValoracionIA } from '../models/comment.model';

// La IA puede tardar en generar el resumen la primera vez; después se sirve desde caché.
const TIMEOUT_VALORACION_MS = 30000;

// Cliente del resumen de valoración (trailverse-agent).
@Injectable({ providedIn: 'root' })
export class AgentValoracionService {
  private readonly base = `${environment.AGENT_URL}/rutas`;

  async obtener(rutaId: string, signal?: AbortSignal): Promise<ValoracionIA> {
    const tiempo = AbortSignal.timeout(TIMEOUT_VALORACION_MS);
    const respuesta = await fetch(`${this.base}/${encodeURIComponent(rutaId)}/valoracion`, {
      headers: { Accept: 'application/json' },
      signal: signal ? AbortSignal.any([signal, tiempo]) : tiempo
    });

    const cuerpo = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
      throw new Error(cuerpo?.error ?? 'No se ha podido cargar el resumen de valoraciones.');
    }
    return cuerpo.data as ValoracionIA;
  }
}
