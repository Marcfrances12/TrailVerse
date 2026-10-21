import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriesStore } from '../../../../core/stores/categories.store';
import { Category, CategoryInput } from '../../../../core/models/category.model';
import { CategoriesApiService } from '../../../../core/services/categories-api.service';
import { detallesDeError } from '../../../../shared/utils/errores';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({
  selector: 'app-category-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-form.html'
})
export class CategoryForm {
  readonly store = inject(CategoriesStore);
  private readonly api = inject(CategoriesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly categoryId = input<string>('');

  private readonly params = toSignal(this.route.paramMap);
  readonly id = computed(() => this.categoryId() || this.params()?.get('id') || '');
  readonly esEdicion = computed(() => Boolean(this.id()));

  readonly categoryOriginal = signal<Category | null>(null);
  readonly erroresServidor = signal<string[]>([]);

  readonly formulario = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    parentId: ['']
  });

  constructor() {
    effect(() => {
      const id = this.id();
      if (id && !this.categoryOriginal()) {
        this.api.porId(id).subscribe({
          next: (res) => {
            const cat = res.data;
            this.categoryOriginal.set(cat);
            this.formulario.patchValue({ name: cat.name, parentId: cat.parentId || '' });
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
    return 'Valor no válido.';
  }

  async guardar(): Promise<void> {
    this.formulario.markAllAsTouched();
    this.erroresServidor.set([]);
    if (this.formulario.invalid) return;
    const valores = this.formulario.getRawValue();
    const datos: CategoryInput = {
      name: String(valores.name ?? '').trim(),
      type: 'ruta',
      parentId: valores.parentId || null
    };
    try {
      if (this.esEdicion()) {
        await this.store.actualizar(this.id(), datos);
      } else {
        await this.store.crear(datos);
      }
      this.router.navigate(['/admin/categorias']);
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
