import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HostsStore } from '../../../../core/stores/hosts.store';
import { Host, HostInput } from '../../../../core/models/host.model';
import { HostsApiService } from '../../../../core/services/hosts-api.service';
import { User } from '../../../../core/models/user.model';
import { environment } from '@environments/environment';
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
  readonly store = inject(HostsStore);
  private readonly api = inject(HostsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  readonly hostId = input<string>('');

  private readonly params = toSignal(this.route.paramMap);
  readonly id = computed(() => this.hostId() || this.params()?.get('id') || '');
  readonly esEdicion = computed(() => Boolean(this.id()));

  readonly hostOriginal = signal<Host | null>(null);
  readonly erroresServidor = signal<string[]>([]);
  readonly usuarios = signal<User[]>([]);

  readonly formulario = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    bio: [''],
    contactEmail: ['', [Validators.required, Validators.email]],
    phone: [''],
    userId: ['']
  });

  constructor() {
    this.http.get<{ data: User[] }>(`${environment.API_URL}/users`).subscribe({
      next: (res) => this.usuarios.set(res.data),
      error: () => undefined
    });

    effect(() => {
      const id = this.id();
      if (id && !this.hostOriginal()) {
        this.api.porId(id).subscribe({
          next: (res) => {
            const host = res.data;
            this.hostOriginal.set(host);
            const userId = typeof host.userId === 'object' && host.userId !== null ? host.userId._id : host.userId || '';
            this.formulario.patchValue({ name: host.name, bio: host.bio, contactEmail: host.contactEmail, phone: host.phone, userId });
          },
          error: () => undefined
        });
      }
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
    if (this.formulario.invalid) return;
    const valores = this.formulario.getRawValue();
    const datos: HostInput = {
      name: String(valores.name ?? '').trim(),
      bio: String(valores.bio ?? '').trim(),
      contactEmail: String(valores.contactEmail ?? '').trim(),
      phone: String(valores.phone ?? '').trim(),
      userId: valores.userId || null
    };
    try {
      if (this.esEdicion()) {
        await this.store.actualizar(this.id(), datos);
      } else {
        await this.store.crear(datos);
      }
      this.router.navigate(['/admin/hosts']);
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
