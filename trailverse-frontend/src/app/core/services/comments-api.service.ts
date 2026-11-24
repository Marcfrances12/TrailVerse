import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RecursoRespuesta } from '../models/api-response';
import {
  Comentario,
  ComentarioAdmin,
  ComentarioDatos,
  ComentariosAdminPagina,
  ComentariosPagina,
  FiltrosComentariosAdmin,
  SentimientoResumen
} from '../models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentsApiService {
  private readonly api = inject(ApiService);

  listar(slug: string, page = 1, limit = 10): Observable<ComentariosPagina> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.api.get<ComentariosPagina>(this.ruta(slug), { params });
  }

  crear(slug: string, datos: ComentarioDatos): Observable<RecursoRespuesta<Comentario>> {
    return this.api.post<RecursoRespuesta<Comentario>>(this.ruta(slug), datos);
  }

  editar(id: string, datos: Partial<ComentarioDatos>): Observable<RecursoRespuesta<Comentario>> {
    return this.api.patch<RecursoRespuesta<Comentario>>(`/comments/${encodeURIComponent(id)}`, datos);
  }

  eliminar(id: string): Observable<RecursoRespuesta<{ _id: string }>> {
    return this.api.delete<RecursoRespuesta<{ _id: string }>>(`/comments/${encodeURIComponent(id)}`);
  }

  // ---------- Admin ----------

  listarAdmin(filtros: FiltrosComentariosAdmin = {}): Observable<ComentariosAdminPagina> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && valor !== '') params = params.set(clave, String(valor));
    }
    return this.api.get<ComentariosAdminPagina>('/admin/comments', { params });
  }

  eliminarAdmin(id: string): Observable<RecursoRespuesta<{ _id: string }>> {
    return this.api.delete<RecursoRespuesta<{ _id: string }>>(`/admin/comments/${encodeURIComponent(id)}`);
  }

  restaurar(id: string): Observable<RecursoRespuesta<ComentarioAdmin>> {
    return this.api.patch<RecursoRespuesta<ComentarioAdmin>>(`/admin/comments/${encodeURIComponent(id)}/restaurar`, {});
  }

  eliminarDefinitivo(id: string): Observable<RecursoRespuesta<{ _id: string }>> {
    return this.api.delete<RecursoRespuesta<{ _id: string }>>(`/admin/comments/${encodeURIComponent(id)}/definitivo`);
  }

  sentimiento(): Observable<RecursoRespuesta<SentimientoResumen>> {
    return this.api.get<RecursoRespuesta<SentimientoResumen>>('/admin/comments/sentimiento');
  }

  private ruta(slug: string): string {
    return `/comments/rutas/${encodeURIComponent(slug)}`;
  }
}
