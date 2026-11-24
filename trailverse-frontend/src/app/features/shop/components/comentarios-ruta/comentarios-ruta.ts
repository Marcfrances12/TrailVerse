import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { Comentario, ComentarioDatos, ComentarioEstadisticas } from '../../../../core/models/comment.model';
import { CommentsApiService } from '../../../../core/services/comments-api.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { Estrellas } from '../../../../shared/components/estrellas/estrellas';
import { ComentarioForm } from '../comentario-form/comentario-form';
import { ComentarioItem } from '../comentario-item/comentario-item';
import { ResumenValoracionIa } from '../resumen-valoracion-ia/resumen-valoracion-ia';

const POR_PAGINA = 10;
const ESTADISTICAS_VACIAS: ComentarioEstadisticas = { total: 0, media: null, reparto: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

function aviso(titulo: string): void {
  Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: titulo, showConfirmButton: false, timer: 2500, timerProgressBar: true });
}

@Component({
  selector: 'app-comentarios-ruta',
  imports: [Estrellas, ComentarioForm, ComentarioItem, ResumenValoracionIa],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comentarios-ruta.html',
  host: { class: 'block' }
})
export class ComentariosRuta {
  private readonly api = inject(CommentsApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthStore);

  readonly slug = input.required<string>();
  readonly rutaId = input.required<string>();
  /** Media y total actualizados, para mostrarlos en la cabecera del detalle. */
  readonly estadisticasCambian = output<ComentarioEstadisticas>();

  private readonly formulario = viewChild(ComentarioForm);

  readonly comentarios = signal<Comentario[]>([]);
  readonly estadisticas = signal<ComentarioEstadisticas>(ESTADISTICAS_VACIAS);
  readonly yaComentado = signal(false);
  readonly pagina = signal(1);
  readonly totalPaginas = signal(1);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly enviando = signal(false);
  readonly editandoId = signal<string | null>(null);
  /** Cambia cada vez que se publica, edita o borra: el resumen IA se vuelve a pedir. */
  readonly version = signal(0);

  readonly hayMas = computed(() => this.pagina() < this.totalPaginas());
  readonly mediaTexto = computed(() => {
    const media = this.estadisticas().media;
    return media === null ? '' : media.toFixed(1).replace('.', ',');
  });
  readonly reparto = computed(() => {
    const { total, reparto } = this.estadisticas();
    return ([5, 4, 3, 2, 1] as const).map((estrellas) => {
      const cantidad = reparto[estrellas] ?? 0;
      return { estrellas, cantidad, porcentaje: total ? Math.round((cantidad / total) * 100) : 0 };
    });
  });

  private carga?: Subscription;

  constructor() {
    effect(() => {
      const slug = this.slug();
      this.auth.user(); // al iniciar o cerrar sesión cambian "esMio" y "yaComentado"
      untracked(() => this.cargar(slug, 1));
    });
    inject(DestroyRef).onDestroy(() => this.carga?.unsubscribe());
  }

  verMas(): void {
    if (!this.cargando() && this.hayMas()) this.cargar(this.slug(), this.pagina() + 1);
  }

  irALogin(): void {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  publicar(datos: ComentarioDatos): void {
    this.enviando.set(true);
    this.api.crear(this.slug(), datos).subscribe({
      next: () => {
        this.enviando.set(false);
        this.formulario()?.limpiar();
        aviso('Comentario publicado');
        this.recargar();
      },
      error: () => {
        // El interceptor muestra el error (p. ej. 409 si ya había comentado desde otra pestaña).
        this.enviando.set(false);
        this.recargar();
      }
    });
  }

  guardar(comentario: Comentario, datos: ComentarioDatos): void {
    this.enviando.set(true);
    this.api.editar(comentario._id, datos).subscribe({
      next: () => {
        this.enviando.set(false);
        this.editandoId.set(null);
        aviso('Comentario actualizado');
        this.recargar();
      },
      error: () => this.enviando.set(false)
    });
  }

  async borrar(comentario: Comentario): Promise<void> {
    const ajeno = !comentario.esMio;
    const resultado = await Swal.fire({
      title: ajeno ? '¿Borrar el comentario de este usuario?' : '¿Borrar tu comentario?',
      text: ajeno
        ? `Comentario de ${comentario.autor.nombre}. Podrás restaurarlo desde el panel de administración.`
        : 'Podrás escribir uno nuevo después.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;

    this.enviando.set(true);
    this.api.eliminar(comentario._id).subscribe({
      next: () => {
        this.enviando.set(false);
        aviso('Comentario eliminado');
        this.recargar();
      },
      error: () => {
        this.enviando.set(false);
        this.recargar();
      }
    });
  }

  reintentar(): void {
    this.cargar(this.slug(), 1);
  }

  private recargar(): void {
    this.version.update((v) => v + 1);
    this.cargar(this.slug(), 1);
  }

  private cargar(slug: string, pagina: number): void {
    this.carga?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);

    this.carga = this.api.listar(slug, pagina, POR_PAGINA).subscribe({
      next: (respuesta) => {
        this.comentarios.update((lista) => (pagina === 1 ? respuesta.data : [...lista, ...respuesta.data]));
        this.estadisticas.set(respuesta.estadisticas);
        this.estadisticasCambian.emit(respuesta.estadisticas);
        this.yaComentado.set(respuesta.yaComentado);
        this.pagina.set(respuesta.page);
        this.totalPaginas.set(respuesta.totalPages);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se han podido cargar los comentarios.');
        this.cargando.set(false);
      }
    });
  }
}
