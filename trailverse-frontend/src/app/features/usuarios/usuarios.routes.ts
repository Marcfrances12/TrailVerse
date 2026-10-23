import { Routes } from '@angular/router';
import { UserList } from './pages/user-list/user-list';
import { UserCreate } from './pages/user-create/user-create';
import { UserEdit } from './pages/user-edit/user-edit';

export const USUARIOS_ROUTES: Routes = [
  { path: '', component: UserList, title: 'Usuarios · TrailVerse' },
  { path: 'new', component: UserCreate, title: 'Crear usuario · TrailVerse' },
  { path: ':id/edit', component: UserEdit, title: 'Editar usuario · TrailVerse' }
];
