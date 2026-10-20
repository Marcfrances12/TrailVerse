import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UsersStore } from '../../../../core/stores/users.store';
import { User, UserInput, UserUpdateInput, Role } from '../../../../core/models/user.model';
import { UsersApiService } from '../../../../core/services/users-api.service';
import { environment } from '@environments/environment';
import { detallesDeError } from '../../../../shared/utils/errores';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-form.html'
})
export class UserForm {
  readonly store = inject(UsersStore);
  private readonly api = inject(UsersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  readonly userId = input<string>('');

  private readonly params = toSignal(this.route.paramMap);
  readonly id = computed(() => this.userId() || this.params()?.get('id') || '');
  readonly esEdicion = computed(() => Boolean(this.id()));

  readonly userOriginal = signal<User | null>(null);
  readonly erroresServidor = signal<string[]>([]);
  readonly roles = signal<Role[]>([]);

  readonly formulario = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(8), Validators.maxLength(72)]],
    roleId: ['', Validators.required]
  });

  constructor() {
    effect(() => {
      const id = this.id();
      if (id && !this.userOriginal()) {
        this.api.porId(id).subscribe({
          next: (res) => {
            const user = res.data;
            this.userOriginal.set(user);
            const roleId = typeof user.roleId === 'object' && user.roleId !== null ? user.roleId._id : user.roleId || '';
            this.formulario.patchValue({ name: user.name, email: user.email, roleId });
          },
          error: () => undefined
        });
      }
    });

    this.cargarRoles();
  }

  private cargarRoles(): void {
    this.http.get<{ data: Role[] }>(`${environment.API_URL}/roles`).subscribe({
      next: (res) => this.roles.set(res.data),
      error: () => undefined
    });
  }

  mostrarError(campo: string): string | null {
    const control = this.formulario.get(campo);
    if (!control || !control.touched || !control.errors) return null;
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('email')) return 'El email no es válido.';
    if (control.hasError('minlength')) return `Mínimo ${control.getError('minlength').requiredLength} caracteres.`;
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
    return 'Valor no válido.';
  }

  async guardar(): Promise<void> {
    this.formulario.markAllAsTouched();
    this.erroresServidor.set([]);

    // En edición, la contraseña es opcional
    if (!this.esEdicion() && !this.formulario.get('password')?.value) {
      this.formulario.get('password')?.setErrors({ required: true });
    }

    if (this.formulario.invalid) return;
    const valores = this.formulario.getRawValue();

    try {
      if (this.esEdicion()) {
        const datos: UserUpdateInput = {
          name: String(valores.name ?? '').trim(),
          email: String(valores.email ?? '').trim(),
          roleId: String(valores.roleId ?? '')
        };
        if (valores.password) {
          datos.password = String(valores.password);
        }
        await this.store.actualizar(this.id(), datos);
      } else {
        const datos: UserInput = {
          name: String(valores.name ?? '').trim(),
          email: String(valores.email ?? '').trim(),
          password: String(valores.password ?? ''),
          roleId: String(valores.roleId ?? '')
        };
        await this.store.crear(datos);
      }
      this.router.navigate(['/admin/usuarios']);
    } catch (error) {
      this.aplicarErroresServidor(error);
    }
  }

  private aplicarErroresServidor(error: unknown): void {
    const mensajes: string[] = [];
    for (const detalle of detallesDeError(error)) {
      const control = this.formulario.get(detalle.campo);
      if (detalle.campo && control) {
        control.setErrors({ servidor: detalle.mensaje });
      } else {
        mensajes.push(detalle.mensaje);
      }
    }
    this.erroresServidor.set(mensajes);
  }
}
