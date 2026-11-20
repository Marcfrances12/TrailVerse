import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterRequest } from '../../../../core/models/auth.model';
import { LoginBrand } from '../../components/login-brand/login-brand';
import { RegisterForm } from '../../components/register-form/register-form';

@Component({
  selector: 'app-register',
  imports: [LoginBrand, RegisterForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.html'
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly enviando = signal(false);
  readonly errorServidor = signal<string | null>(null);

  async guardar(datos: RegisterRequest): Promise<void> {
    this.errorServidor.set(null);
    this.enviando.set(true);
    try {
      await firstValueFrom(this.auth.register(datos));
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Cuenta creada. Inicia sesión para continuar.',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true
      });
      this.router.navigateByUrl('/login');
    } catch (error) {
      this.errorServidor.set(this.mensajeDeError(error));
    } finally {
      this.enviando.set(false);
    }
  }

  private mensajeDeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'No se pudo conectar con el servidor.';
      if (error.status === 429 || error.status === 409) return error.error?.error ?? 'No se pudo crear la cuenta.';
      if (error.status === 400 && Array.isArray(error.error?.details) && error.error.details.length > 0) {
        const primero = error.error.details[0];
        return typeof primero === 'string' ? primero : primero.mensaje;
      }
      if (typeof error.error?.error === 'string') return error.error.error;
    }
    return 'No se ha podido crear la cuenta. Inténtalo de nuevo.';
  }
}
