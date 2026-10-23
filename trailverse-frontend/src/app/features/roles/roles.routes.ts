import { Routes } from '@angular/router';
import { RoleList } from './pages/role-list/role-list';
import { RoleCreate } from './pages/role-create/role-create';
import { RoleEdit } from './pages/role-edit/role-edit';

export const ROLES_ROUTES: Routes = [
  { path: '', component: RoleList, title: 'Roles · TrailVerse' },
  { path: 'new', component: RoleCreate, title: 'Crear rol · TrailVerse' },
  { path: ':id/edit', component: RoleEdit, title: 'Editar rol · TrailVerse' }
];
