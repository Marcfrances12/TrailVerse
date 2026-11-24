import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LikeEstado } from '../../../../core/models/like.model';
import { LikesApiService } from '../../../../core/services/likes-api.service';
import { AuthStore } from '../../../../core/stores/auth.store';

@Component({
  selector: 'app-like-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './like-button.html'
})
export class LikeButton {
  private readonly api = inject(LikesApiService);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  readonly slug = input.required<string>();

  readonly estado = signal<LikeEstado>({ total: 0, likedByMe: false });
  readonly enviando = signal(false);

  private carga?: Subscription;

  constructor() {
    effect(() => this.cargar(this.slug()));
    inject(DestroyRef).onDestroy(() => this.carga?.unsubscribe());
  }

  alternar(): void {
    if (this.enviando()) return;

    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const anterior = this.estado();
    const quitar = anterior.likedByMe;

    // Se actualiza al momento; si el servidor falla, se vuelve atrás.
    this.estado.set({ total: anterior.total + (quitar ? -1 : 1), likedByMe: !quitar });
    this.enviando.set(true);

    const peticion = quitar ? this.api.quitarLike(this.slug()) : this.api.darLike(this.slug());
    peticion.subscribe({
      next: (respuesta) => {
        this.estado.set(respuesta.data);
        this.enviando.set(false);
      },
      error: () => {
        // El aviso lo muestra el interceptor de errores. Se recupera el estado real del servidor
        // (por ejemplo, tras un 409 porque el like ya se había dado desde otra pestaña).
        this.estado.set(anterior);
        this.enviando.set(false);
        this.cargar(this.slug());
      }
    });
  }

  private cargar(slug: string): void {
    this.carga?.unsubscribe();
    this.carga = this.api.estado(slug).subscribe({
      next: (respuesta) => this.estado.set(respuesta.data),
      error: () => {}
    });
  }
}
