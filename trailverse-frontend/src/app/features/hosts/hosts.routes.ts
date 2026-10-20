import { Routes } from '@angular/router';
import { HostList } from './pages/host-list/host-list';
import { HostCreate } from './pages/host-create/host-create';
import { HostEdit } from './pages/host-edit/host-edit';
import { HostDetail } from './pages/host-detail/host-detail';

export const HOSTS_ROUTES: Routes = [
  { path: '', component: HostList, title: 'Hosts · TrailVerse' },
  { path: 'new', component: HostCreate, title: 'Crear host · TrailVerse' },
  { path: ':id/edit', component: HostEdit, title: 'Editar host · TrailVerse' },
  { path: ':id', component: HostDetail, title: 'Detalle de host · TrailVerse' }
];
