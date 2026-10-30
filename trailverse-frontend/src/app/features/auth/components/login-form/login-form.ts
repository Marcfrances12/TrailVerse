import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthStore } from '../../../../core/stores/auth.store';

@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-form.html'
})
export class LoginForm {
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly enviando = signal(false);
  readonly errorServidor = signal<string | null>(null);
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

  async iniciarSesion(): Promise<void> {
    this.formulario.markAllAsTouched();
    this.errorServidor.set(null);
    if (this.formulario.invalid) return;

    const valores = this.formulario.getRawValue();
    this.enviando.set(true);
    try {
      await this.store.login({
        identificador: String(valores.identificador ?? '').trim(),
        password: String(valores.password ?? '')
      });
      this.router.navigateByUrl(this.destino());
    } catch (error) {
      this.errorServidor.set(this.mensajeDeError(error));
    } finally {
      this.enviando.set(false);
    }
  }

  private destino(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') && !returnUrl.startsWith('/login')) {
      return returnUrl;
    }
    return this.store.isAdmin() ? '/admin/rutas' : '/rutas';
  }

  private mensajeDeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'No se pudo conectar con el servidor.';
      if (error.status === 401) return 'Usuario o contraseña incorrectos.';
      if (typeof error.error?.error === 'string') return error.error.error;
    }
    return 'No se ha podido iniciar sesión. Inténtalo de nuevo.';
  }
}
