import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-user-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-avatar.html'
})
export class UserAvatar {
  readonly nombre = input<string | null>(null);
  readonly url = input('');

  /** Recordamos la URL que falló para volver a intentarlo si cambia. */
  private readonly urlFallida = signal<string | null>(null);

  readonly mostrarImagen = computed(() => this.url() !== '' && this.url() !== this.urlFallida());

  readonly iniciales = computed(() => {
    const nombre = this.nombre()?.trim();
    if (!nombre) return '?';
    return nombre
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? '')
      .join('');
  });

  marcarFallida(): void {
    this.urlFallida.set(this.url());
  }
}
