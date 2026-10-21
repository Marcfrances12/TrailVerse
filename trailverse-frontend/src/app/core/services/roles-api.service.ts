import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ListaRespuesta, RecursoRespuesta } from '../models/api-response';
import { Role, RoleInput, RolesFiltros } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RolesApiService {
  private readonly api = inject(ApiService);

  private construirParams(filtros?: RolesFiltros): HttpParams | undefined {
    if (!filtros) return undefined;
    let params = new HttpParams();
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor === undefined || valor === null || valor === '') return;
      params = params.set(clave, String(valor));
    });
    return params.keys().length > 0 ? params : undefined;
  }

  listar(filtros?: RolesFiltros): Observable<ListaRespuesta<Role>> {
    return this.api.get<ListaRespuesta<Role>>('/roles', { params: this.construirParams(filtros) });
  }

  porId(id: string): Observable<RecursoRespuesta<Role>> {
    return this.api.get<RecursoRespuesta<Role>>(`/roles/${id}`);
  }

  crear(datos: RoleInput): Observable<RecursoRespuesta<Role>> {
    return this.api.post<RecursoRespuesta<Role>, RoleInput>('/roles', datos);
  }

  actualizar(id: string, datos: Partial<RoleInput>): Observable<RecursoRespuesta<Role>> {
    return this.api.put<RecursoRespuesta<Role>, Partial<RoleInput>>(`/roles/${id}`, datos);
  }

  activar(id: string): Observable<RecursoRespuesta<Role>> {
    return this.api.patch<RecursoRespuesta<Role>, object>(`/roles/${id}/activate`, {});
  }

  desactivar(id: string): Observable<RecursoRespuesta<Role>> {
    return this.api.patch<RecursoRespuesta<Role>, object>(`/roles/${id}/deactivate`, {});
  }

  eliminar(id: string): Observable<RecursoRespuesta<Role>> {
    return this.api.delete<RecursoRespuesta<Role>>(`/roles/${id}`);
  }

  eliminados(): Observable<ListaRespuesta<Role>> {
    return this.api.get<ListaRespuesta<Role>>('/roles/deleted');
  }

  restaurar(id: string): Observable<RecursoRespuesta<Role>> {
    return this.api.patch<RecursoRespuesta<Role>, object>(`/roles/${id}/restore`, {});
  }

  borrarDefinitivo(id: string): Observable<RecursoRespuesta<Role>> {
    return this.api.delete<RecursoRespuesta<Role>>(`/roles/${id}/permanent`);
  }
}
