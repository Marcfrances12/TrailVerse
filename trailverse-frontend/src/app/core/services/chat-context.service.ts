import { Injectable, signal } from '@angular/core';

// Ruta que el usuario está viendo. El asistente la usa como contexto; sin ruta responde en modo general.
@Injectable({ providedIn: 'root' })
export class ChatContextService {
  private readonly _rutaId = signal<string | null>(null);
  readonly rutaId = this._rutaId.asReadonly();

  establecerRuta(id: string | null): void {
    this._rutaId.set(id);
  }
}
