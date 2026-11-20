import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RecursoRespuesta } from '../models/api-response';
import { AuthUser, LoginRequest, LoginResponse, RegisterRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  login(datos: LoginRequest): Observable<RecursoRespuesta<LoginResponse>> {
    return this.api.post<RecursoRespuesta<LoginResponse>, LoginRequest>('/auth/login', datos);
  }

  register(datos: RegisterRequest): Observable<RecursoRespuesta<AuthUser>> {
    return this.api.post<RecursoRespuesta<AuthUser>, RegisterRequest>('/auth/register', datos);
  }

  logout(): Observable<{ ok: boolean; message: string }> {
    return this.api.post<{ ok: boolean; message: string }, object>('/auth/logout', {});
  }

  me(): Observable<RecursoRespuesta<AuthUser>> {
    return this.api.get<RecursoRespuesta<AuthUser>>('/auth/me');
  }
}
