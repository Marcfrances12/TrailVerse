import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginRequest } from '../../../../core/models/auth.model';

@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-form.html'
})
export class LoginForm {
  private readonly fb = inject(FormBuilder);

  readonly enviando = input(false);
  readonly errorServidor = input<string | null>(null);

  readonly guardar = output<LoginRequest>();

  readonly mostrarPassword = signal(false);

  readonly formulario = this.fb.group({
    identificador: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  mostrarError(campo: string): string | null {
    const control = this.formulario.get(campo);
    if (!control || !control.touched || !control.errors) return null;
    if (control.hasError('required')) return 'Este campo es obligatorio.';
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
      identificador: String(valores.identificador ?? '').trim(),
      password: String(valores.password ?? '')
    });
  }
}
