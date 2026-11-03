import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HostsStore } from '../../../../core/stores/hosts.store';
import { UsersApiService } from '../../../../core/services/users-api.service';
import { HostInput } from '../../../../core/models/host.model';
import { User } from '../../../../core/models/user.model';
import { HostForm } from '../../components/host-form/host-form';

@Component({
  selector: 'app-host-create',
  imports: [HostForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-host-form
      [users]="users()"
      [enviando]="store.cargando()"
      [errorServidor]="errorServidor()"
      (guardar)="guardar($event)" />
  `
})
export class HostCreate {
  readonly store = inject(HostsStore);
  private readonly usersApi = inject(UsersApiService);
  private readonly router = inject(Router);

  readonly users = signal<User[]>([]);
  readonly errorServidor = signal<unknown>(null);

  constructor() {
    this.usersApi.listar().subscribe({
      next: (respuesta) => this.users.set(respuesta.data),
      error: () => undefined
    });
  }

  async guardar(datos: HostInput): Promise<void> {
    try {
      await this.store.crear(datos);
      this.router.navigate(['/admin/hosts']);
    } catch (error) {
      this.errorServidor.set(error);
    }
  }
}
