import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Role, RoleInput, PERMISOS } from '../../../../core/models/role.model';
import { detallesDeError } from '../../../../shared/utils/errores';

@Component({
  selector: 'app-role-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './role-form.html'
})
export class RoleForm {
  private readonly fb = inject(FormBuilder);

  readonly role = input<Role | null>(null);
  readonly esEdicion = input(false);
  readonly enviando = input(false);
  readonly errorServidor = input<unknown>(null);

  readonly guardar = output<RoleInput>();

  readonly erroresServidor = signal<string[]>([]);
  readonly permisos = PERMISOS;

  readonly formulario = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    permissions: [[] as string[]]
  });

  constructor() {
    effect(() => {
      const role = this.role();
      if (!role) return;
      this.formulario.patchValue({ name: role.name, permissions: role.permissions });
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
    if (control.hasError('minlength')) return `Mínimo ${control.getError('minlength').requiredLength} caracteres.`;
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
    if (control.hasError('servidor')) return control.getError('servidor');
    return 'Valor no válido.';
  }

  enviar(): void {
    this.formulario.markAllAsTouched();
    this.erroresServidor.set([]);
    if (this.formulario.invalid) return;

    const valores = this.formulario.getRawValue();
    const datos: RoleInput = {
      name: String(valores.name ?? '').trim().toLowerCase(),
      permissions: (valores.permissions ?? []).map(String)
    };
    this.guardar.emit(datos);
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
