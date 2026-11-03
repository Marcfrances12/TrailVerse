import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { UsersStore } from '../../../../core/stores/users.store';
import { UsersApiService } from '../../../../core/services/users-api.service';
import { RolesApiService } from '../../../../core/services/roles-api.service';
import { Role } from '../../../../core/models/role.model';
import { User, UserInput, UserUpdateInput } from '../../../../core/models/user.model';
import { UserForm } from '../../components/user-form/user-form';

@Component({
  selector: 'app-user-edit',
  imports: [UserForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-user-form
      [esEdicion]="true"
      [usuario]="usuario()"
      [roles]="roles()"
      [enviando]="store.cargando()"
      [errorServidor]="errorServidor()"
      (guardar)="guardar($event)" />
  `
})
export class UserEdit {
  readonly store = inject(UsersStore);
  private readonly usersApi = inject(UsersApiService);
  private readonly rolesApi = inject(RolesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly params = toSignal(this.route.paramMap);
  readonly id = computed(() => this.params()?.get('id') ?? '');

  readonly usuario = signal<User | null>(null);
  readonly roles = signal<Role[]>([]);
  readonly errorServidor = signal<unknown>(null);

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      this.usersApi.porId(id).subscribe({
        next: (respuesta) => this.usuario.set(respuesta.data),
        error: () => undefined
      });
    });

    this.rolesApi.listar({ isActive: true }).subscribe({
      next: (respuesta) => this.roles.set(respuesta.data),
      error: () => undefined
    });
  }

  async guardar(datos: UserInput | UserUpdateInput): Promise<void> {
    try {
      await this.store.actualizar(this.id(), datos as UserUpdateInput);
      this.router.navigate(['/admin/usuarios']);
    } catch (error) {
      this.errorServidor.set(error);
    }
  }
}
