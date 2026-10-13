import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, timeout } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';

interface RequestOptions {
  headers?: HttpHeaders;
  params?: HttpParams;
  responseType?: any;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly baseUrl = environment.API_URL;
  private readonly timeoutMs = environment.TIMEOUT_MS;

  constructor(private http: HttpClient) {}

  private withTimeout<T>(source: Observable<T>): Observable<T> {
    return source.pipe(
      timeout(this.timeoutMs),
      catchError((error) => {
        if (error?.name === 'TimeoutError' || error?.message?.includes('Timeout')) {
          const err = new Error('La petición ha excedido el tiempo de espera.');
          (err as any).cause = error;
          (err as any).status = 408;
          return throwError(() => err);
        }
        return throwError(() => error);
      })
    );
  }

  get<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    return this.withTimeout(this.http.get<T>(`${this.baseUrl}${endpoint}`, options));
  }

  post<T, B = any>(endpoint: string, body: B, options?: RequestOptions): Observable<T> {
    return this.withTimeout(this.http.post<T>(`${this.baseUrl}${endpoint}`, body, options));
  }

  put<T, B = any>(endpoint: string, body: B, options?: RequestOptions): Observable<T> {
    return this.withTimeout(this.http.put<T>(`${this.baseUrl}${endpoint}`, body, options));
  }

  patch<T, B = any>(endpoint: string, body: B, options?: RequestOptions): Observable<T> {
    return this.withTimeout(this.http.patch<T>(`${this.baseUrl}${endpoint}`, body, options));
  }

  delete<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    return this.withTimeout(this.http.delete<T>(`${this.baseUrl}${endpoint}`, options));
  }
}
