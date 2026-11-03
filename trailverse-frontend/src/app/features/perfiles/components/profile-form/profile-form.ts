import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Profile, ProfileUpdateInput } from '../../../../core/models/profile.model';
import { detallesDeError } from '../../../../shared/utils/errores';
import { urlValidator } from '../../../../shared/utils/validators';

@Component({
  selector: 'app-profile-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-form.html'
})
export class ProfileForm {
  private readonly fb = inject(FormBuilder);

  readonly perfil = input.required<Profile>();
  readonly enviando = input(false);
  readonly errorServidor = input<unknown>(null);

  readonly guardar = output<ProfileUpdateInput>();

  readonly erroresServidor = signal<string[]>([]);

  readonly formulario = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    avatarUrl: ['', [urlValidator]],
    bio: ['', [Validators.maxLength(500)]],
    phone: ['', [Validators.maxLength(30)]]
  });

  constructor() {
    effect(() => {
      const perfil = this.perfil();
      this.formulario.reset({
        name: perfil.name ?? '',
        avatarUrl: perfil.avatarUrl ?? '',
        bio: perfil.bio ?? '',
        phone: perfil.phone ?? ''
      });
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
    if (control.hasError('urlInvalida')) return 'La URL no es válida.';
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
    this.guardar.emit({
      name: String(valores.name ?? '').trim(),
      avatarUrl: String(valores.avatarUrl ?? '').trim(),
      bio: String(valores.bio ?? '').trim(),
      phone: String(valores.phone ?? '').trim()
    });
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
