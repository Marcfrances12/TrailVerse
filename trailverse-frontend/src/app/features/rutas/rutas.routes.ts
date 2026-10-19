import { Routes } from '@angular/router';
import { RutaDetail } from './pages/ruta-detail/ruta-detail';
import { RutaCreate } from './pages/ruta-create/ruta-create';
import { RutaEdit } from './pages/ruta-edit/ruta-edit';
import { RutaList } from './pages/ruta-list/ruta-list';

export const RUTAS_ROUTES: Routes = [
  { path: '', component: RutaList, title: 'Rutas · TrailVerse' },
  { path: 'new', component: RutaCreate, title: 'Crear ruta · TrailVerse' },
  { path: ':slug/edit', component: RutaEdit, title: 'Editar ruta · TrailVerse' },
  { path: ':slug', component: RutaDetail, title: 'Detalle de ruta · TrailVerse' }
];
