import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { ProfilesApiService } from '../../../../core/services/profiles-api.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { ProfilesStore } from '../../../../core/stores/profiles.store';
import { Profile, ProfileUpdateInput } from '../../../../core/models/profile.model';
import { ProfileForm } from '../../components/profile-form/profile-form';
import { LikesApiService } from '../../../../core/services/likes-api.service';
import { CommentsApiService } from '../../../../core/services/comments-api.service';
import { ComentarioPropio } from '../../../../core/models/comment.model';
import { ShopRuta } from '../../../../core/models/shop.model';
import { ShopRutaCard } from '../../../shop/components/shop-ruta-card/shop-ruta-card';
import { Estrellas } from '../../../../shared/components/estrellas/estrellas';
import { formatFecha } from '../../../../shared/utils/formatos';

export type PestanaPerfil = 'favoritas' | 'opiniones' | 'editar';
const PESTANAS: PestanaPerfil[] = ['favoritas', 'opiniones', 'editar'];

@Component({
  selector: 'app-mi-perfil',
  imports: [RouterLink, ProfileForm, ShopRutaCard, Estrellas],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mi-perfil.html'
})
export class MiPerfil {
  private readonly api = inject(ProfilesApiService);
  private readonly commentsApi = inject(CommentsApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthStore);
  private readonly perfiles = inject(ProfilesStore);

  readonly formatFecha = formatFecha;

  readonly perfil = signal<Profile | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly enviando = signal(false);
  readonly errorServidor = signal<unknown>(null);
  readonly avatarRoto = signal(false);

  readonly rutasQueMeGustan = signal<ShopRuta[]>([]);
  readonly cargandoLikes = signal(true);
  readonly errorLikes = signal(false);

  readonly opiniones = signal<ComentarioPropio[]>([]);
  readonly cargandoOpiniones = signal(true);
  readonly errorOpiniones = signal(false);
  readonly borrandoId = signal<string | null>(null);

  /** Pestaña activa, guardada en la URL (?tab=opiniones) para poder enlazarla y volver atrás. */
  readonly pestana = signal<PestanaPerfil>(this.pestanaDeUrl());

  readonly iniciales = computed(() => {
    const nombre = this.perfil()?.name?.trim() || this.auth.user()?.email || '?';
    return nombre.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
  });

  readonly mostrarAvatar = computed(() => Boolean(this.perfil()?.avatarUrl) && !this.avatarRoto());

  /** Portada: la foto de la última ruta que te ha gustado. */
  readonly portada = computed(() => this.rutasQueMeGustan().find((ruta) => ruta.coverImage?.url)?.coverImage ?? null);

  readonly miembroDesde = computed(() => {
    const fecha = this.perfil()?.created_at;
    if (!fecha) return null;
    return new Date(fecha).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  });

  readonly estadisticas = computed(() => {
    const opiniones = this.opiniones();
    const media = opiniones.length
      ? opiniones.reduce((suma, c) => suma + c.valoracion, 0) / opiniones.length
      : null;
    const km = this.rutasQueMeGustan().reduce((suma, r) => suma + r.distanciaKm, 0);
    return [
      { valor: this.cargandoLikes() ? '–' : String(this.rutasQueMeGustan().length), etiqueta: 'favoritas' },
      { valor: this.cargandoOpiniones() ? '–' : String(opiniones.length), etiqueta: 'opiniones' },
      { valor: media === null ? '–' : media.toFixed(1).replace('.', ','), etiqueta: 'nota media que das' },
      { valor: this.cargandoLikes() ? '–' : `${Math.round(km)} km`, etiqueta: 'en tus favoritas' }
    ];
  });

  constructor() {
    inject(LikesApiService).misLikes().subscribe({
      next: (respuesta) => {
        this.rutasQueMeGustan.set(respuesta.data);
        this.cargandoLikes.set(false);
      },
      error: () => {
        this.errorLikes.set(true);
        this.cargandoLikes.set(false);
      }
    });

    this.cargarOpiniones();

    this.api.miPerfil().subscribe({
      next: (respuesta) => {
        this.perfil.set(respuesta.data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se ha podido cargar tu perfil.');
        this.cargando.set(false);
      }
    });
  }

  cambiarPestana(pestana: PestanaPerfil): void {
    this.pestana.set(pestana);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: pestana === 'favoritas' ? null : pestana },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  /** Flechas izquierda/derecha entre pestañas (patrón de tabs accesible). */
  tecladoPestanas(evento: KeyboardEvent): void {
    const actual = PESTANAS.indexOf(this.pestana());
    let siguiente = actual;
    if (evento.key === 'ArrowRight') siguiente = (actual + 1) % PESTANAS.length;
    else if (evento.key === 'ArrowLeft') siguiente = (actual - 1 + PESTANAS.length) % PESTANAS.length;
    else return;
    evento.preventDefault();
    this.cambiarPestana(PESTANAS[siguiente]);
    document.getElementById(`pestana-${PESTANAS[siguiente]}`)?.focus();
  }

  async guardar(datos: ProfileUpdateInput): Promise<void> {
    this.enviando.set(true);
    this.errorServidor.set(null);
    try {
      const respuesta = await firstValueFrom(this.api.actualizarMiPerfil(datos));
      this.perfil.set(respuesta.data);
      this.avatarRoto.set(false);
      this.perfiles.actualizarMiPerfil(respuesta.data);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Perfil actualizado', showConfirmButton: false, timer: 2500, timerProgressBar: true });
    } catch (error) {
      this.errorServidor.set(error);
    } finally {
      this.enviando.set(false);
    }
  }

  async borrarOpinion(comentario: ComentarioPropio): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Borrar tu opinión?',
      text: `Tu opinión sobre "${comentario.ruta.nombre}" dejará de verse. Podrás escribir otra después.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;

    this.borrandoId.set(comentario._id);
    this.commentsApi.eliminar(comentario._id).subscribe({
      next: () => {
        this.borrandoId.set(null);
        this.opiniones.update((lista) => lista.filter((c) => c._id !== comentario._id));
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Opinión eliminada', showConfirmButton: false, timer: 2500, timerProgressBar: true });
      },
      error: () => this.borrandoId.set(null) // el interceptor muestra el aviso
    });
  }

  private cargarOpiniones(): void {
    this.cargandoOpiniones.set(true);
    this.commentsApi.mias().subscribe({
      next: (respuesta) => {
        this.opiniones.set(respuesta.data);
        this.cargandoOpiniones.set(false);
      },
      error: () => {
        this.errorOpiniones.set(true);
        this.cargandoOpiniones.set(false);
      }
    });
  }

  private pestanaDeUrl(): PestanaPerfil {
    const valor = this.route.snapshot.queryParamMap.get('tab');
    return PESTANAS.includes(valor as PestanaPerfil) ? (valor as PestanaPerfil) : 'favoritas';
  }
}
