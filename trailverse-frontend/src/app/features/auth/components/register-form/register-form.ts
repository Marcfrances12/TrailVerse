import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegisterRequest } from '../../../../core/models/auth.model';

@Component({
  selector: 'app-register-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register-form.html'
})
export class RegisterForm {
  private readonly fb = inject(FormBuilder);

  readonly enviando = input(false);
  readonly errorServidor = input<string | null>(null);

  readonly guardar = output<RegisterRequest>();

  readonly mostrarPassword = signal(false);

  readonly formulario = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]]
  });

  mostrarError(campo: string): string | null {
    const control = this.formulario.get(campo);
    if (!control || !control.touched || !control.errors) return null;
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('email')) return 'Introduce un email válido.';
    if (control.hasError('minlength')) {
      const minimo = control.getError('minlength').requiredLength;
      return campo === 'password'
        ? `La contraseña debe tener al menos ${minimo} caracteres.`
        : `Debe tener al menos ${minimo} caracteres.`;
    }
    if (control.hasError('maxlength')) return 'Supera la longitud máxima permitida.';
    return 'Valor no válido.';
  }

  togglePassword(): void {
    this.mostrarPassword.update((valor) => !valor);
  }

  enviar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;

    const valores = this.formulario.getRawValue();
    this.guardar.emit({
      name: String(valores.name ?? '').trim(),
      email: String(valores.email ?? '').trim(),
      password: String(valores.password ?? '')
    });
  }
}
