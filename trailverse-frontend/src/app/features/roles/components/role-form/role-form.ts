import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolesStore } from '../../../../core/stores/roles.store';
import { Role, RoleInput, PERMISOS } from '../../../../core/models/role.model';
import { RolesApiService } from '../../../../core/services/roles-api.service';
import { detallesDeError } from '../../../../shared/utils/errores';

@Component({
  selector: 'app-role-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './role-form.html'
})
export class RoleForm {
  readonly store = inject(RolesStore);
  private readonly api = inject(RolesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly roleId = input<string>('');

  private readonly params = toSignal(this.route.paramMap);
  readonly id = computed(() => this.roleId() || this.params()?.get('id') || '');
  readonly esEdicion = computed(() => Boolean(this.id()));

  readonly roleOriginal = signal<Role | null>(null);
  readonly erroresServidor = signal<string[]>([]);
  readonly permisos = PERMISOS;

  readonly formulario = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    permissions: [[] as string[]]
  });

  constructor() {
    effect(() => {
      const id = this.id();
      if (id && !this.roleOriginal()) {
        this.api.porId(id).subscribe({
          next: (res) => {
            const role = res.data;
            this.roleOriginal.set(role);
            this.formulario.patchValue({ name: role.name, permissions: role.permissions });
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
    if (control.hasError('minlength')) return `Mínimo ${control.getError('minlength').requiredLength} caracteres.`;
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
    if (control.hasError('servidor')) return control.getError('servidor');
    return 'Valor no válido.';
  }

  async guardar(): Promise<void> {
    this.formulario.markAllAsTouched();
    this.erroresServidor.set([]);
    if (this.formulario.invalid) return;

    const valores = this.formulario.getRawValue();
    const datos: RoleInput = {
      name: String(valores.name ?? '').trim().toLowerCase(),
      permissions: (valores.permissions ?? []).map(String)
    };

    try {
      if (this.esEdicion()) {
        await this.store.actualizar(this.id(), datos);
      } else {
        await this.store.crear(datos);
      }
      this.router.navigate(['/admin/roles']);
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
