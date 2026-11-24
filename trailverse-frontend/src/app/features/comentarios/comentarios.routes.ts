import { Routes } from '@angular/router';
import { ComentarioList } from './pages/comentario-list/comentario-list';

export const COMENTARIOS_ROUTES: Routes = [
  { path: '', component: ComentarioList, title: 'Comentarios · TrailVerse' }
];
