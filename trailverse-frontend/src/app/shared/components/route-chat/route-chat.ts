import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  signal,
  viewChild
} from '@angular/core';
import { AgentChatService, MensajeHistorial } from '../../../core/services/agent-chat.service';
import { renderMarkdownSeguro } from '../../utils/markdown-seguro';

interface MensajeChat {
  id: number;
  rol: 'user' | 'assistant';
  texto: string;
}

const MAX_MENSAJE = 500;
const MAX_HISTORIAL = 10;

const ETIQUETAS_HERRAMIENTA: Record<string, string> = {
  get_route_info: 'Consultando la ruta',
  search_faqs: 'Revisando las preguntas frecuentes',
  search_nearby_places: 'Buscando lugares cercanos',
  geocode_place: 'Localizando el lugar'
};

const SUGERENCIAS = [
  { etiqueta: '¿Cómo llego en transporte público?', mensaje: '¿Cómo llego en transporte público al punto de inicio?' },
  { etiqueta: '¿Dónde comer cerca?', mensaje: '¿Dónde puedo comer cerca del punto de inicio?' },
  { etiqueta: '¿Dónde dormir cerca?', mensaje: '¿Dónde puedo dormir cerca de la ruta?' },
  { etiqueta: 'Preguntas frecuentes', mensaje: 'Quiero ver las preguntas frecuentes de esta ruta' }
];

@Component({
  selector: 'app-route-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-chat.html'
})
export class RouteChat {
  readonly routeId = input<string | null>(null);

  readonly sugerencias = SUGERENCIAS;

  readonly abierto = signal(false);
  readonly mensajes = signal<MensajeChat[]>([]);
  readonly borrador = signal('');
  readonly escribiendo = signal(false);
  readonly herramienta = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly puedeEnviar = computed(() => !this.escribiendo() && this.borrador().trim().length > 0);

  private readonly servicio = inject(AgentChatService);
  private readonly contenedor = viewChild<ElementRef<HTMLElement>>('contenedor');
  private controlador: AbortController | null = null;
  private ultimoId = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.controlador?.abort());
  }

  alternar(): void {
    this.abierto.update((abierto) => !abierto);
    if (this.abierto()) this.desplazarAlFinal();
  }

  actualizarBorrador(evento: Event): void {
    this.borrador.set((evento.target as HTMLInputElement).value);
  }

  enviarDesdeFormulario(evento: Event): void {
    evento.preventDefault();
    void this.enviar(this.borrador());
  }

  usarSugerencia(sugerencia: { mensaje: string }): void {
    void this.enviar(sugerencia.mensaje);
  }

  markdown(texto: string): string {
    return renderMarkdownSeguro(texto);
  }

  async enviar(texto: string): Promise<void> {
    const mensaje = texto.trim().slice(0, MAX_MENSAJE);
    if (!mensaje || this.escribiendo()) return;

    const historial: MensajeHistorial[] = this.mensajes()
      .filter((item) => item.texto.trim())
      .slice(-MAX_HISTORIAL)
      .map((item) => ({ role: item.rol, content: item.texto }));

    const idUsuario = ++this.ultimoId;
    const idAsistente = ++this.ultimoId;

    this.mensajes.update((lista) => [
      ...lista,
      { id: idUsuario, rol: 'user', texto: mensaje },
      { id: idAsistente, rol: 'assistant', texto: '' }
    ]);
    this.borrador.set('');
    this.error.set(null);
    this.escribiendo.set(true);
    this.desplazarAlFinal();

    const controlador = new AbortController();
    this.controlador = controlador;

    try {
      await this.servicio.enviar(
        { message: mensaje, history: historial, routeId: this.routeId() },
        {
          onToken: (texto) => this.anexar(idAsistente, texto),
          onTool: (nombre, estado) =>
            this.herramienta.set(estado === 'ejecutando' ? (ETIQUETAS_HERRAMIENTA[nombre] ?? 'Consultando') : null)
        },
        controlador.signal
      );
    } catch (error) {
      if (!controlador.signal.aborted) {
        this.error.set(error instanceof Error ? error.message : 'Ha ocurrido un error inesperado.');
      }
    } finally {
      this.escribiendo.set(false);
      this.herramienta.set(null);
      this.controlador = null;
      this.quitarSiVacio(idAsistente);
      this.desplazarAlFinal();
    }
  }

  private anexar(id: number, fragmento: string): void {
    this.mensajes.update((lista) =>
      lista.map((item) => (item.id === id ? { ...item, texto: item.texto + fragmento } : item))
    );
    this.desplazarAlFinal();
  }

  private quitarSiVacio(id: number): void {
    this.mensajes.update((lista) => lista.filter((item) => item.id !== id || item.texto.trim() !== ''));
  }

  private desplazarAlFinal(): void {
    requestAnimationFrame(() => {
      const elemento = this.contenedor()?.nativeElement;
      if (elemento) elemento.scrollTop = elemento.scrollHeight;
    });
  }
}
