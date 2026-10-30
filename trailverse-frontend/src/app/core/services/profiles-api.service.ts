import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ListaRespuesta, RecursoRespuesta } from '../models/api-response';
import { PerfilAdmin, PerfilesFiltros, Profile, ProfileUpdateInput } from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class ProfilesApiService {
  private readonly api = inject(ApiService);

  listar(filtros: PerfilesFiltros = {}): Observable<ListaRespuesta<PerfilAdmin>> {
    const query = filtros.soloIncidencias ? '?soloIncidencias=true' : '';
    return this.api.get<ListaRespuesta<PerfilAdmin>>(`/profiles${query}`);
  }

  miPerfil(): Observable<RecursoRespuesta<Profile>> {
    return this.api.get<RecursoRespuesta<Profile>>('/profiles/me');
  }

  actualizarMiPerfil(datos: ProfileUpdateInput): Observable<RecursoRespuesta<Profile>> {
    return this.api.patch<RecursoRespuesta<Profile>, ProfileUpdateInput>('/profiles/me', datos);
  }

  porUsuario(userId: string): Observable<RecursoRespuesta<Profile>> {
    return this.api.get<RecursoRespuesta<Profile>>(`/profiles/${userId}`);
  }

  actualizarPorUsuario(userId: string, datos: ProfileUpdateInput): Observable<RecursoRespuesta<Profile>> {
    return this.api.patch<RecursoRespuesta<Profile>, ProfileUpdateInput>(`/profiles/${userId}`, datos);
  }
}
