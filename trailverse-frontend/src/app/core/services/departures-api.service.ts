import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ListaRespuesta, RecursoRespuesta } from '../models/api-response';
import { Departure, DepartureInput, DeparturesFiltros } from '../models/departure.model';

@Injectable({ providedIn: 'root' })
export class DeparturesApiService {
  private readonly api = inject(ApiService);

  private construirParams(filtros?: DeparturesFiltros): HttpParams | undefined {
    if (!filtros) return undefined;
    let params = new HttpParams();
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor === undefined || valor === null || valor === '') return;
      params = params.set(clave, String(valor));
    });
    return params.keys().length > 0 ? params : undefined;
  }

  listar(filtros?: DeparturesFiltros): Observable<ListaRespuesta<Departure>> {
    return this.api.get<ListaRespuesta<Departure>>('/departures', { params: this.construirParams(filtros) });
  }

  porId(id: string): Observable<RecursoRespuesta<Departure>> {
    return this.api.get<RecursoRespuesta<Departure>>(`/departures/${id}`);
  }

  crear(datos: DepartureInput): Observable<RecursoRespuesta<Departure>> {
    return this.api.post<RecursoRespuesta<Departure>, DepartureInput>('/departures', datos);
  }

  actualizar(id: string, datos: Partial<DepartureInput>): Observable<RecursoRespuesta<Departure>> {
    return this.api.put<RecursoRespuesta<Departure>, Partial<DepartureInput>>(`/departures/${id}`, datos);
  }

  activar(id: string): Observable<RecursoRespuesta<Departure>> {
    return this.api.patch<RecursoRespuesta<Departure>, object>(`/departures/${id}/activate`, {});
  }

  desactivar(id: string): Observable<RecursoRespuesta<Departure>> {
    return this.api.patch<RecursoRespuesta<Departure>, object>(`/departures/${id}/deactivate`, {});
  }

  eliminar(id: string): Observable<RecursoRespuesta<Departure>> {
    return this.api.delete<RecursoRespuesta<Departure>>(`/departures/${id}`);
  }

  eliminados(): Observable<ListaRespuesta<Departure>> {
    return this.api.get<ListaRespuesta<Departure>>('/departures/deleted');
  }

  restaurar(id: string): Observable<RecursoRespuesta<Departure>> {
    return this.api.patch<RecursoRespuesta<Departure>, object>(`/departures/${id}/restore`, {});
  }

  borrarDefinitivo(id: string): Observable<RecursoRespuesta<Departure>> {
    return this.api.delete<RecursoRespuesta<Departure>>(`/departures/${id}/permanent`);
  }
}
