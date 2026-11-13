import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';

export interface MensajeHistorial {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatEnvio {
  message: string;
  history: MensajeHistorial[];
  routeId?: string | null;
}

export interface ChatEventos {
  onToken: (texto: string) => void;
  onTool: (nombre: string, estado: 'ejecutando' | 'hecho') => void;
}

// Consume POST /api/agent/chat (SSE) con fetch: EventSource no permite POST.
@Injectable({ providedIn: 'root' })
export class AgentChatService {
  private readonly url = `${environment.AGENT_URL}/chat`;

  async enviar(envio: ChatEnvio, eventos: ChatEventos, signal: AbortSignal): Promise<void> {
    const respuesta = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(envio),
      signal
    });

    if (!respuesta.ok) {
      throw new Error(await this.mensajeDeError(respuesta));
    }

    if (!respuesta.body) {
      throw new Error('El asistente no ha devuelto ninguna respuesta.');
    }

    const lector = respuesta.body.getReader();
    const decodificador = new TextDecoder();
    let pendiente = '';

    while (true) {
      const { value, done } = await lector.read();
      if (done) break;

      pendiente += decodificador.decode(value, { stream: true });
      const bloques = pendiente.split('\n\n');
      pendiente = bloques.pop() ?? '';

      for (const bloque of bloques) {
        this.procesarBloque(bloque, eventos);
      }
    }
  }

  private procesarBloque(bloque: string, eventos: ChatEventos): void {
    let evento = 'message';
    let datos = '';

    for (const linea of bloque.split('\n')) {
      if (linea.startsWith('event:')) evento = linea.slice(6).trim();
      else if (linea.startsWith('data:')) datos += linea.slice(5).trim();
    }

    if (!datos) return;

    const payload = JSON.parse(datos);

    switch (evento) {
      case 'token':
        eventos.onToken(payload.texto);
        break;
      case 'tool':
        eventos.onTool(payload.nombre, payload.estado);
        break;
      case 'error':
        throw new Error(payload.mensaje);
    }
  }

  private async mensajeDeError(respuesta: Response): Promise<string> {
    if (respuesta.status === 429) {
      return 'Has enviado demasiadas consultas. Espera unos minutos antes de volver a intentarlo.';
    }

    try {
      const cuerpo = await respuesta.json();
      return cuerpo.details?.[0]?.mensaje ?? cuerpo.error ?? 'No se pudo enviar el mensaje.';
    } catch {
      return 'No se pudo enviar el mensaje.';
    }
  }
}
