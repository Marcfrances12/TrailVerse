import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-profile-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-header.html'
})
export class ProfileHeader {
  readonly nombre = input<string | null>(null);
  readonly email = input<string | null>(null);
  readonly rol = input<string | null>(null);
  readonly avatarUrl = input('');

  readonly iniciales = computed(() => {
    const nombre = this.nombre()?.trim();
    if (nombre) {
      return nombre
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase() ?? '')
        .join('');
    }
    return this.email()?.[0]?.toUpperCase() ?? '?';
  });
}
