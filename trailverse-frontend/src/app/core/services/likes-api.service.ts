import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ListaRespuesta, RecursoRespuesta } from '../models/api-response';
import { LikeEstado } from '../models/like.model';
import { ShopRuta } from '../models/shop.model';

@Injectable({ providedIn: 'root' })
export class LikesApiService {
  private readonly api = inject(ApiService);

  estado(slug: string): Observable<RecursoRespuesta<LikeEstado>> {
    return this.api.get<RecursoRespuesta<LikeEstado>>(this.ruta(slug));
  }

  darLike(slug: string): Observable<RecursoRespuesta<LikeEstado>> {
    return this.api.post<RecursoRespuesta<LikeEstado>>(this.ruta(slug), {});
  }

  quitarLike(slug: string): Observable<RecursoRespuesta<LikeEstado>> {
    return this.api.delete<RecursoRespuesta<LikeEstado>>(this.ruta(slug));
  }

  misLikes(): Observable<ListaRespuesta<ShopRuta>> {
    return this.api.get<ListaRespuesta<ShopRuta>>('/likes/me');
  }

  private ruta(slug: string): string {
    return `/likes/rutas/${encodeURIComponent(slug)}`;
  }
}
