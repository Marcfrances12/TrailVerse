import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore } from '../../../../core/stores/auth.store';
import { LoginRequest } from '../../../../core/models/auth.model';
import { LoginBrand } from '../../components/login-brand/login-brand';
import { LoginForm } from '../../components/login-form/login-form';

@Component({
  selector: 'app-login',
  imports: [LoginBrand, LoginForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html'
})
export class Login {
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly enviando = signal(false);
  readonly errorServidor = signal<string | null>(null);

  async guardar(datos: LoginRequest): Promise<void> {
    this.errorServidor.set(null);
    this.enviando.set(true);
    try {
      await this.store.login(datos);
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
    return this.store.isAdmin() ? '/admin/rutas' : '/';
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
