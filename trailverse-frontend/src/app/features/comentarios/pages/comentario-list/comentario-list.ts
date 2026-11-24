import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import {
  ComentarioAdmin,
  EstadoComentariosAdmin,
  FiltrosComentariosAdmin,
  Sentimiento
} from '../../../../core/models/comment.model';
import { CommentsApiService } from '../../../../core/services/comments-api.service';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { Estrellas } from '../../../../shared/components/estrellas/estrellas';
import { formatFechaHora } from '../../../../shared/utils/formatos';

const POR_PAGINA = 20;

export const ETIQUETAS_SENTIMIENTO: Record<Sentimiento, string> = {
  positivo: 'Positivo',
  neutro: 'Neutro',
  negativo: 'Negativo'
};

export const CLASES_SENTIMIENTO: Record<Sentimiento, string> = {
  positivo: 'bg-bosque-100 text-bosque-800',
  neutro: 'bg-crema-200 text-tinta-suave',
  negativo: 'bg-red-100 text-red-700'
};

function aviso(titulo: string): void {
  Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: titulo, showConfirmButton: false, timer: 2500, timerProgressBar: true });
}

// Moderación: el admin ve los comentarios de todos los usuarios, los borra, restaura o elimina definitivamente.
@Component({
  selector: 'app-comentario-list',
  imports: [RouterLink, Estrellas, EmptyState, ErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comentario-list.html'
})
export class ComentarioList {
  private readonly api = inject(CommentsApiService);

  readonly etiquetasSentimiento = ETIQUETAS_SENTIMIENTO;
  readonly clasesSentimiento = CLASES_SENTIMIENTO;
  readonly formatFechaHora = formatFechaHora;

  readonly estado = signal<EstadoComentariosAdmin>('activos');
  readonly sentimiento = signal<Sentimiento | 'pendiente' | ''>('');
  readonly busqueda = signal('');
  readonly rutaId = signal<string | undefined>(undefined);
  readonly pagina = signal(1);

  readonly comentarios = signal<ComentarioAdmin[]>([]);
  readonly total = signal(0);
  readonly totalPaginas = signal(1);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly procesando = signal<string | null>(null);

  readonly resumen = computed(() => {
    const total = this.total();
    if (!total) return 'Sin comentarios con estos filtros';
    return `${total} ${total === 1 ? 'comentario' : 'comentarios'}`;
  });

  private carga?: Subscription;
  private temporizador?: ReturnType<typeof setTimeout>;

  constructor() {
    // Desde el dashboard se puede abrir filtrado por ruta: /admin/comentarios?rutaId=...
    const params = inject(ActivatedRoute).snapshot.queryParamMap;
    const rutaId = params.get('rutaId');
    const sentimiento = params.get('sentimiento');
    if (rutaId && /^[a-f\d]{24}$/i.test(rutaId)) this.rutaId.set(rutaId);
    if (sentimiento === 'positivo' || sentimiento === 'neutro' || sentimiento === 'negativo') this.sentimiento.set(sentimiento);

    this.cargar();
    inject(DestroyRef).onDestroy(() => {
      this.carga?.unsubscribe();
      clearTimeout(this.temporizador);
    });
  }

  cambiarEstado(estado: EstadoComentariosAdmin): void {
    this.estado.set(estado);
    this.irAPagina(1);
  }

  cambiarSentimiento(evento: Event): void {
    this.sentimiento.set((evento.target as HTMLSelectElement).value as Sentimiento | 'pendiente' | '');
    this.irAPagina(1);
  }

  buscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.irAPagina(1), 350);
  }

  quitarFiltroRuta(): void {
    this.rutaId.set(undefined);
    this.irAPagina(1);
  }

  irAPagina(pagina: number): void {
    this.pagina.set(Math.max(1, pagina));
    this.cargar();
  }

  cargar(): void {
    const filtros: FiltrosComentariosAdmin = {
      page: this.pagina(),
      limit: POR_PAGINA,
      estado: this.estado(),
      sentimiento: this.sentimiento(),
      q: this.busqueda().trim() || undefined,
      rutaId: this.rutaId()
    };

    this.carga?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);

    this.carga = this.api.listarAdmin(filtros).subscribe({
      next: (respuesta) => {
        this.comentarios.set(respuesta.data);
        this.total.set(respuesta.total);
        this.totalPaginas.set(respuesta.totalPages);
        this.pagina.set(respuesta.page);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se han podido cargar los comentarios.');
        this.cargando.set(false);
      }
    });
  }

  async eliminar(comentario: ComentarioAdmin): Promise<void> {
    const confirmado = await this.confirmar({
      title: '¿Borrar este comentario?',
      text: `Comentario de ${comentario.autor.nombre} en "${comentario.ruta.nombre}". Dejará de verse en la web y podrás restaurarlo.`,
      confirmButtonText: 'Sí, borrar',
      peligro: true
    });
    if (confirmado) this.ejecutar(comentario, this.api.eliminarAdmin(comentario._id), 'Comentario eliminado');
  }

  async restaurar(comentario: ComentarioAdmin): Promise<void> {
    const confirmado = await this.confirmar({
      title: '¿Restaurar este comentario?',
      text: 'Volverá a mostrarse en el detalle de la ruta.',
      confirmButtonText: 'Sí, restaurar',
      peligro: false
    });
    if (confirmado) this.ejecutar(comentario, this.api.restaurar(comentario._id), 'Comentario restaurado');
  }

  async borrarDefinitivo(comentario: ComentarioAdmin): Promise<void> {
    const confirmado = await this.confirmar({
      title: '¿Eliminar definitivamente?',
      text: 'El comentario se borrará de forma permanente. Esta acción no se puede deshacer.',
      confirmButtonText: 'Sí, eliminar para siempre',
      peligro: true
    });
    if (confirmado) this.ejecutar(comentario, this.api.eliminarDefinitivo(comentario._id), 'Comentario eliminado definitivamente');
  }

  private ejecutar(comentario: ComentarioAdmin, peticion: Observable<unknown>, mensaje: string): void {
    this.procesando.set(comentario._id);
    peticion.subscribe({
      next: () => {
        this.procesando.set(null);
        aviso(mensaje);
        this.cargar();
      },
      error: () => this.procesando.set(null) // el interceptor muestra el aviso
    });
  }

  private async confirmar(opciones: { title: string; text: string; confirmButtonText: string; peligro: boolean }): Promise<boolean> {
    const resultado = await Swal.fire({
      title: opciones.title,
      text: opciones.text,
      icon: opciones.peligro ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: opciones.confirmButtonText,
      confirmButtonColor: opciones.peligro ? '#b91c1c' : '#2d6a4f',
      cancelButtonText: 'Cancelar'
    });
    return resultado.isConfirmed;
  }
}
