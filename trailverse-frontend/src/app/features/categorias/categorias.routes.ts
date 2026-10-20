import { Routes } from '@angular/router';
import { CategoryList } from './pages/category-list/category-list';
import { CategoryCreate } from './pages/category-create/category-create';
import { CategoryEdit } from './pages/category-edit/category-edit';
import { CategoryDetail } from './pages/category-detail/category-detail';

export const CATEGORIAS_ROUTES: Routes = [
  { path: '', component: CategoryList, title: 'Categorías · TrailVerse' },
  { path: 'new', component: CategoryCreate, title: 'Crear categoría · TrailVerse' },
  { path: ':id/edit', component: CategoryEdit, title: 'Editar categoría · TrailVerse' },
  { path: ':id', component: CategoryDetail, title: 'Detalle de categoría · TrailVerse' }
];
