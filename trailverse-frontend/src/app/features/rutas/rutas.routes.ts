import { Routes } from '@angular/router';
import { RutaCreate } from './pages/ruta-create/ruta-create';
import { RutaEdit } from './pages/ruta-edit/ruta-edit';
import { RutaList } from './pages/ruta-list/ruta-list';

export const RUTAS_ADMIN_ROUTES: Routes = [
  { path: '', component: RutaList, title: 'Gestión de rutas · TrailVerse' },
  { path: 'new', component: RutaCreate, title: 'Crear ruta · TrailVerse' },
  { path: ':slug/edit', component: RutaEdit, title: 'Editar ruta · TrailVerse' }
];
