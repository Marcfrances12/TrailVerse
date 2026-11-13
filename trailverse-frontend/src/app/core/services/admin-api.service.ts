import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RecursoRespuesta } from '../models/api-response';
import { AdminResumen } from '../models/admin-resumen.model';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly api = inject(ApiService);

  resumen(): Observable<RecursoRespuesta<AdminResumen>> {
    return this.api.get<RecursoRespuesta<AdminResumen>>('/admin/resumen');
  }
}
