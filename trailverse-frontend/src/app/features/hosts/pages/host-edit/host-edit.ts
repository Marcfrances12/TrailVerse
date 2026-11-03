import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HostsStore } from '../../../../core/stores/hosts.store';
import { HostsApiService } from '../../../../core/services/hosts-api.service';
import { UsersApiService } from '../../../../core/services/users-api.service';
import { Host, HostInput } from '../../../../core/models/host.model';
import { User } from '../../../../core/models/user.model';
import { HostForm } from '../../components/host-form/host-form';

@Component({
  selector: 'app-host-edit',
  imports: [HostForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-host-form
      [esEdicion]="true"
      [host]="host()"
      [users]="users()"
      [enviando]="store.cargando()"
      [errorServidor]="errorServidor()"
      (guardar)="guardar($event)" />
  `
})
export class HostEdit {
  readonly store = inject(HostsStore);
  private readonly api = inject(HostsApiService);
  private readonly usersApi = inject(UsersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly params = toSignal(this.route.paramMap);
  readonly id = computed(() => this.params()?.get('id') ?? '');

  readonly host = signal<Host | null>(null);
  readonly users = signal<User[]>([]);
  readonly errorServidor = signal<unknown>(null);

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      this.api.porId(id).subscribe({
        next: (respuesta) => this.host.set(respuesta.data),
        error: () => undefined
      });
    });

    this.usersApi.listar().subscribe({
      next: (respuesta) => this.users.set(respuesta.data),
      error: () => undefined
    });
  }

  async guardar(datos: HostInput): Promise<void> {
    try {
      await this.store.actualizar(this.id(), datos);
      this.router.navigate(['/admin/hosts']);
    } catch (error) {
      this.errorServidor.set(error);
    }
  }
}
