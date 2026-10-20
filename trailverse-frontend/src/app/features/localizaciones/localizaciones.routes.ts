import { Routes } from '@angular/router';
import { LocationList } from './pages/location-list/location-list';
import { LocationCreate } from './pages/location-create/location-create';
import { LocationEdit } from './pages/location-edit/location-edit';
import { LocationDetail } from './pages/location-detail/location-detail';

export const LOCALIZACIONES_ROUTES: Routes = [
  { path: '', component: LocationList, title: 'Localizaciones · TrailVerse' },
  { path: 'new', component: LocationCreate, title: 'Crear localización · TrailVerse' },
  { path: ':id/edit', component: LocationEdit, title: 'Editar localización · TrailVerse' },
  { path: ':id', component: LocationDetail, title: 'Detalle de localización · TrailVerse' }
];
