import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ListaRespuesta, RecursoRespuesta } from '../models/api-response';
import { Category, CategoryInput, CategoriesFiltros } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoriesApiService {
  private readonly api = inject(ApiService);

  private construirParams(filtros?: CategoriesFiltros): HttpParams | undefined {
    if (!filtros) return undefined;
    let params = new HttpParams();
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor === undefined || valor === null || valor === '') return;
      params = params.set(clave, String(valor));
    });
    return params.keys().length > 0 ? params : undefined;
  }

  listar(filtros?: CategoriesFiltros): Observable<ListaRespuesta<Category>> {
    return this.api.get<ListaRespuesta<Category>>('/categories', { params: this.construirParams(filtros) });
  }

  porId(id: string): Observable<RecursoRespuesta<Category>> {
    return this.api.get<RecursoRespuesta<Category>>(`/categories/${id}`);
  }

  crear(datos: CategoryInput): Observable<RecursoRespuesta<Category>> {
    return this.api.post<RecursoRespuesta<Category>, CategoryInput>('/categories', datos);
  }

  actualizar(id: string, datos: Partial<CategoryInput>): Observable<RecursoRespuesta<Category>> {
    return this.api.put<RecursoRespuesta<Category>, Partial<CategoryInput>>(`/categories/${id}`, datos);
  }

  activar(id: string): Observable<RecursoRespuesta<Category>> {
    return this.api.patch<RecursoRespuesta<Category>, object>(`/categories/${id}/activate`, {});
  }

  desactivar(id: string): Observable<RecursoRespuesta<Category>> {
    return this.api.patch<RecursoRespuesta<Category>, object>(`/categories/${id}/deactivate`, {});
  }

  eliminar(id: string): Observable<RecursoRespuesta<Category>> {
    return this.api.delete<RecursoRespuesta<Category>>(`/categories/${id}`);
  }

  eliminados(): Observable<ListaRespuesta<Category>> {
    return this.api.get<ListaRespuesta<Category>>('/categories/deleted');
  }

  restaurar(id: string): Observable<RecursoRespuesta<Category>> {
    return this.api.patch<RecursoRespuesta<Category>, object>(`/categories/${id}/restore`, {});
  }

  borrarDefinitivo(id: string): Observable<RecursoRespuesta<Category>> {
    return this.api.delete<RecursoRespuesta<Category>>(`/categories/${id}/permanent`);
  }
}
