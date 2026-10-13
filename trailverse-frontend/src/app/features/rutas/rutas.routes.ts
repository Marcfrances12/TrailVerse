import { Routes } from '@angular/router';
import { RutaDetail } from './pages/ruta-detail/ruta-detail';
import { RutaForm } from './pages/ruta-form/ruta-form';
import { RutaList } from './pages/ruta-list/ruta-list';

export const RUTAS_ROUTES: Routes = [
  { path: '', component: RutaList, title: 'Rutas · TrailVerse' },
  { path: 'new', component: RutaForm, title: 'Crear ruta · TrailVerse' },
  { path: ':slug/edit', component: RutaForm, title: 'Editar ruta · TrailVerse' },
  { path: ':slug', component: RutaDetail, title: 'Detalle de ruta · TrailVerse' }
];