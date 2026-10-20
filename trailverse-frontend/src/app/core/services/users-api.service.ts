import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ListaRespuesta, RecursoRespuesta } from '../models/api-response';
import { User, UserInput, UserUpdateInput, UsersFiltros } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly api = inject(ApiService);

  private construirParams(filtros?: UsersFiltros): HttpParams | undefined {
    if (!filtros) return undefined;
    let params = new HttpParams();
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor === undefined || valor === null || valor === '') return;
      params = params.set(clave, String(valor));
    });
    return params.keys().length > 0 ? params : undefined;
  }

  listar(filtros?: UsersFiltros): Observable<ListaRespuesta<User>> {
    return this.api.get<ListaRespuesta<User>>('/users', { params: this.construirParams(filtros) });
  }

  porId(id: string): Observable<RecursoRespuesta<User>> {
    return this.api.get<RecursoRespuesta<User>>(`/users/${id}`);
  }

  crear(datos: UserInput): Observable<RecursoRespuesta<User>> {
    return this.api.post<RecursoRespuesta<User>, UserInput>('/users', datos);
  }

  actualizar(id: string, datos: UserUpdateInput): Observable<RecursoRespuesta<User>> {
    return this.api.put<RecursoRespuesta<User>, UserUpdateInput>(`/users/${id}`, datos);
  }

  activar(id: string): Observable<RecursoRespuesta<User>> {
    return this.api.patch<RecursoRespuesta<User>, object>(`/users/${id}/activate`, {});
  }

  desactivar(id: string): Observable<RecursoRespuesta<User>> {
    return this.api.patch<RecursoRespuesta<User>, object>(`/users/${id}/deactivate`, {});
  }

  eliminar(id: string): Observable<RecursoRespuesta<User>> {
    return this.api.delete<RecursoRespuesta<User>>(`/users/${id}`);
  }
}
