import { Component } from '@angular/core';
import { CategoryForm } from '../../components/category-form/category-form';

@Component({
  selector: 'app-category-create',
  imports: [CategoryForm],
  template: '<app-category-form />'
})
export class CategoryCreate {}
