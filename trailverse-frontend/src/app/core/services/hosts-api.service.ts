import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ListaRespuesta, RecursoRespuesta } from '../models/api-response';
import { Host, HostInput, HostsFiltros } from '../models/host.model';

@Injectable({ providedIn: 'root' })
export class HostsApiService {
  private readonly api = inject(ApiService);

  private construirParams(filtros?: HostsFiltros): HttpParams | undefined {
    if (!filtros) return undefined;
    let params = new HttpParams();
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor === undefined || valor === null || valor === '') return;
      params = params.set(clave, String(valor));
    });
    return params.keys().length > 0 ? params : undefined;
  }

  listar(filtros?: HostsFiltros): Observable<ListaRespuesta<Host>> {
    return this.api.get<ListaRespuesta<Host>>('/hosts', { params: this.construirParams(filtros) });
  }

  porId(id: string): Observable<RecursoRespuesta<Host>> {
    return this.api.get<RecursoRespuesta<Host>>(`/hosts/${id}`);
  }

  crear(datos: HostInput): Observable<RecursoRespuesta<Host>> {
    return this.api.post<RecursoRespuesta<Host>, HostInput>('/hosts', datos);
  }

  actualizar(id: string, datos: Partial<HostInput>): Observable<RecursoRespuesta<Host>> {
    return this.api.put<RecursoRespuesta<Host>, Partial<HostInput>>(`/hosts/${id}`, datos);
  }

  activar(id: string): Observable<RecursoRespuesta<Host>> {
    return this.api.patch<RecursoRespuesta<Host>, object>(`/hosts/${id}/activate`, {});
  }

  desactivar(id: string): Observable<RecursoRespuesta<Host>> {
    return this.api.patch<RecursoRespuesta<Host>, object>(`/hosts/${id}/deactivate`, {});
  }

  eliminar(id: string): Observable<RecursoRespuesta<Host>> {
    return this.api.delete<RecursoRespuesta<Host>>(`/hosts/${id}`);
  }

  eliminados(): Observable<ListaRespuesta<Host>> {
    return this.api.get<ListaRespuesta<Host>>('/hosts/deleted');
  }

  restaurar(id: string): Observable<RecursoRespuesta<Host>> {
    return this.api.patch<RecursoRespuesta<Host>, object>(`/hosts/${id}/restore`, {});
  }

  borrarDefinitivo(id: string): Observable<RecursoRespuesta<Host>> {
    return this.api.delete<RecursoRespuesta<Host>>(`/hosts/${id}/permanent`);
  }
}
