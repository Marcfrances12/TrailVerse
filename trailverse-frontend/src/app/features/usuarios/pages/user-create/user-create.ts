import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UsersStore } from '../../../../core/stores/users.store';
import { RolesApiService } from '../../../../core/services/roles-api.service';
import { Role } from '../../../../core/models/role.model';
import { UserInput, UserUpdateInput } from '../../../../core/models/user.model';
import { UserForm } from '../../components/user-form/user-form';

@Component({
  selector: 'app-user-create',
  imports: [UserForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-user-form
      [roles]="roles()"
      [enviando]="store.cargando()"
      [errorServidor]="errorServidor()"
      (guardar)="guardar($event)" />
  `
})
export class UserCreate {
  readonly store = inject(UsersStore);
  private readonly rolesApi = inject(RolesApiService);
  private readonly router = inject(Router);

  readonly roles = signal<Role[]>([]);
  readonly errorServidor = signal<unknown>(null);

  constructor() {
    this.rolesApi.listar({ isActive: true }).subscribe({
      next: (respuesta) => this.roles.set(respuesta.data),
      error: () => undefined
    });
  }

  async guardar(datos: UserInput | UserUpdateInput): Promise<void> {
    try {
      await this.store.crear(datos as UserInput);
      this.router.navigate(['/admin/usuarios']);
    } catch (error) {
      this.errorServidor.set(error);
    }
  }
}
