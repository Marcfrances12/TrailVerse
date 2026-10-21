import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ListaRespuesta, RecursoRespuesta } from '../models/api-response';
import { Ruta, RutaInput, RutasFiltros } from '../models/ruta.model';

@Injectable({ providedIn: 'root' })
export class RutasApiService {
  private readonly api = inject(ApiService);

  private construirParams(filtros?: RutasFiltros): HttpParams | undefined {
    if (!filtros) return undefined;

    let params = new HttpParams();
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor === undefined || valor === null || valor === '') return;
      params = params.set(clave, String(valor));
    });

    return params.keys().length > 0 ? params : undefined;
  }

  listar(filtros?: RutasFiltros): Observable<ListaRespuesta<Ruta>> {
    return this.api.get<ListaRespuesta<Ruta>>('/rutas', { params: this.construirParams(filtros) });
  }

  porSlug(slug: string): Observable<RecursoRespuesta<Ruta>> {
    return this.api.get<RecursoRespuesta<Ruta>>(`/rutas/slug/${encodeURIComponent(slug)}`);
  }

  porId(id: string): Observable<RecursoRespuesta<Ruta>> {
    return this.api.get<RecursoRespuesta<Ruta>>(`/rutas/${id}`);
  }

  crear(datos: RutaInput): Observable<RecursoRespuesta<Ruta>> {
    return this.api.post<RecursoRespuesta<Ruta>, RutaInput>('/rutas', datos);
  }

  actualizar(id: string, datos: Partial<RutaInput>): Observable<RecursoRespuesta<Ruta>> {
    return this.api.put<RecursoRespuesta<Ruta>, Partial<RutaInput>>(`/rutas/${id}`, datos);
  }

  activar(id: string): Observable<RecursoRespuesta<Ruta>> {
    return this.api.patch<RecursoRespuesta<Ruta>, object>(`/rutas/${id}/activate`, {});
  }

  desactivar(id: string): Observable<RecursoRespuesta<Ruta>> {
    return this.api.patch<RecursoRespuesta<Ruta>, object>(`/rutas/${id}/deactivate`, {});
  }

  eliminar(id: string): Observable<RecursoRespuesta<Ruta>> {
    return this.api.delete<RecursoRespuesta<Ruta>>(`/rutas/${id}`);
  }

  eliminados(): Observable<ListaRespuesta<Ruta>> {
    return this.api.get<ListaRespuesta<Ruta>>('/rutas/deleted');
  }

  restaurar(id: string): Observable<RecursoRespuesta<Ruta>> {
    return this.api.patch<RecursoRespuesta<Ruta>, object>(`/rutas/${id}/restore`, {});
  }

  borrarDefinitivo(id: string): Observable<RecursoRespuesta<Ruta>> {
    return this.api.delete<RecursoRespuesta<Ruta>>(`/rutas/${id}/permanent`);
  }
}
