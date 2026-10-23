import { Routes } from '@angular/router';
import { DepartureList } from './pages/departure-list/departure-list';
import { DepartureCreate } from './pages/departure-create/departure-create';
import { DepartureEdit } from './pages/departure-edit/departure-edit';

export const DEPARTURES_ROUTES: Routes = [
  { path: '', component: DepartureList, title: 'Departures · TrailVerse' },
  { path: 'new', component: DepartureCreate, title: 'Crear salida · TrailVerse' },
  { path: ':id/edit', component: DepartureEdit, title: 'Editar salida · TrailVerse' }
];
