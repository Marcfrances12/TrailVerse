import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../../core/models/category.model';
import { formatFecha } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-category-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-card.html'
})
export class CategoryCard {
  readonly category = input.required<Category>();
  readonly papelera = input(false);
  readonly cambiarEstado = output<Category>();
  readonly eliminar = output<Category>();
  readonly restaurar = output<Category>();
  readonly borrarDefinitivo = output<Category>();
  readonly formatFecha = formatFecha;
}
