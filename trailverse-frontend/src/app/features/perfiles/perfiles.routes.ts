import { Routes } from '@angular/router';
import { MiPerfil } from './pages/mi-perfil/mi-perfil';
import { ProfileList } from './pages/profile-list/profile-list';
import { ProfileEdit } from './pages/profile-edit/profile-edit';

export const PERFILES_ROUTES: Routes = [
  { path: '', component: MiPerfil, title: 'Mi perfil · TrailVerse' }
];

export const PERFILES_ADMIN_ROUTES: Routes = [
  { path: '', component: ProfileList, title: 'Perfiles · TrailVerse' },
  { path: ':userId/edit', component: ProfileEdit, title: 'Editar perfil · TrailVerse' }
];
