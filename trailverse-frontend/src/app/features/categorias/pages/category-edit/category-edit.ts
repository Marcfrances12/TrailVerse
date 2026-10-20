import { Component, input } from '@angular/core';
import { CategoryForm } from '../../components/category-form/category-form';

@Component({
  selector: 'app-category-edit',
  imports: [CategoryForm],
  template: '<app-category-form [categoryId]="categoryId()" />'
})
export class CategoryEdit {
  readonly categoryId = input<string>('');
}
