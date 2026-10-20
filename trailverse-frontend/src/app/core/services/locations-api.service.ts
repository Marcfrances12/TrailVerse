import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ListaRespuesta, RecursoRespuesta } from '../models/api-response';
import { Location, LocationInput, LocationsFiltros } from '../models/location.model';

@Injectable({ providedIn: 'root' })
export class LocationsApiService {
  private readonly api = inject(ApiService);

  private construirParams(filtros?: LocationsFiltros): HttpParams | undefined {
    if (!filtros) return undefined;
    let params = new HttpParams();
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor === undefined || valor === null || valor === '') return;
      params = params.set(clave, String(valor));
    });
    return params.keys().length > 0 ? params : undefined;
  }

  listar(filtros?: LocationsFiltros): Observable<ListaRespuesta<Location>> {
    return this.api.get<ListaRespuesta<Location>>('/locations', { params: this.construirParams(filtros) });
  }

  porId(id: string): Observable<RecursoRespuesta<Location>> {
    return this.api.get<RecursoRespuesta<Location>>(`/locations/${id}`);
  }

  crear(datos: LocationInput): Observable<RecursoRespuesta<Location>> {
    return this.api.post<RecursoRespuesta<Location>, LocationInput>('/locations', datos);
  }

  actualizar(id: string, datos: Partial<LocationInput>): Observable<RecursoRespuesta<Location>> {
    return this.api.put<RecursoRespuesta<Location>, Partial<LocationInput>>(`/locations/${id}`, datos);
  }

  activar(id: string): Observable<RecursoRespuesta<Location>> {
    return this.api.patch<RecursoRespuesta<Location>, object>(`/locations/${id}/activate`, {});
  }

  desactivar(id: string): Observable<RecursoRespuesta<Location>> {
    return this.api.patch<RecursoRespuesta<Location>, object>(`/locations/${id}/deactivate`, {});
  }

  eliminar(id: string): Observable<RecursoRespuesta<Location>> {
    return this.api.delete<RecursoRespuesta<Location>>(`/locations/${id}`);
  }
}
