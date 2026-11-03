import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Host, HostInput } from '../../../../core/models/host.model';
import { User } from '../../../../core/models/user.model';
import { detallesDeError } from '../../../../shared/utils/errores';
import { urlValidator } from '../../../../shared/utils/validators';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({
  selector: 'app-host-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './host-form.html'
})
export class HostForm {
  private readonly fb = inject(FormBuilder);

  readonly host = input<Host | null>(null);
  readonly users = input<User[]>([]);
  readonly esEdicion = input(false);
  readonly enviando = input(false);
  readonly errorServidor = input<unknown>(null);

  readonly guardar = output<HostInput>();

  readonly erroresServidor = signal<string[]>([]);

  readonly formulario = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    bio: [''],
    contactEmail: ['', [Validators.required, Validators.email]],
    phone: [''],
    userId: ['']
  });

  constructor() {
    effect(() => {
      const host = this.host();
      if (!host) return;
      const userId = typeof host.userId === 'object' && host.userId !== null ? host.userId._id : host.userId || '';
      this.formulario.patchValue({ name: host.name, bio: host.bio, contactEmail: host.contactEmail, phone: host.phone, userId });
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
    return 'Valor no válido.';
  }

  enviar(): void {
    this.formulario.markAllAsTouched();
    this.erroresServidor.set([]);
    if (this.formulario.invalid) return;
    const valores = this.formulario.getRawValue();
    const datos: HostInput = {
      name: String(valores.name ?? '').trim(),
      bio: String(valores.bio ?? '').trim(),
      contactEmail: String(valores.contactEmail ?? '').trim(),
      phone: String(valores.phone ?? '').trim(),
      userId: valores.userId || null
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
