import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { User, UserInput, UserUpdateInput } from '../../../../core/models/user.model';
import { Role } from '../../../../core/models/role.model';
import { detallesDeError } from '../../../../shared/utils/errores';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-form.html'
})
export class UserForm {
  private readonly fb = inject(FormBuilder);

  readonly usuario = input<User | null>(null);
  readonly roles = input<Role[]>([]);
  readonly esEdicion = input(false);
  readonly enviando = input(false);
  readonly errorServidor = input<unknown>(null);

  readonly guardar = output<UserInput | UserUpdateInput>();

  readonly erroresServidor = signal<string[]>([]);

  readonly formulario = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(8), Validators.maxLength(72)]],
    roleId: ['', Validators.required]
  });

  constructor() {
    effect(() => {
      const usuario = this.usuario();
      if (!usuario) return;
      const roleId = typeof usuario.roleId === 'object' && usuario.roleId !== null ? usuario.roleId._id : usuario.roleId || '';
      this.formulario.patchValue({ name: usuario.name ?? '', email: usuario.email, roleId });
    });

    effect(() => {
      const error = this.errorServidor();
      if (error) this.aplicarErroresServidor(error);
    });
  }

  mostrarError(campo: string): string | null {
    const control = this.formulario.get(campo);
    if (!control || !control.touched || !control.errors) return null;
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('email')) return 'El email no es válido.';
    if (control.hasError('minlength')) return `Mínimo ${control.getError('minlength').requiredLength} caracteres.`;
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
    if (control.hasError('servidor')) return control.getError('servidor');
    return 'Valor no válido.';
  }

  enviar(): void {
    this.formulario.markAllAsTouched();
    this.erroresServidor.set([]);

    // En edición, la contraseña es opcional
    if (!this.esEdicion() && !this.formulario.get('password')?.value) {
      this.formulario.get('password')?.setErrors({ required: true });
    }

    if (this.formulario.invalid) return;
    const valores = this.formulario.getRawValue();
    const base = {
      name: String(valores.name ?? '').trim(),
      email: String(valores.email ?? '').trim(),
      roleId: String(valores.roleId ?? '')
    };

    if (this.esEdicion()) {
      const datos: UserUpdateInput = { ...base };
      if (valores.password) datos.password = String(valores.password);
      this.guardar.emit(datos);
    } else {
      this.guardar.emit({ ...base, password: String(valores.password ?? '') });
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
