import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Lote, FilterLoteParams } from '../interfaces/lote.interface';
import { PaginatedResponse, PaginationParams } from '../interfaces/pagination.interface';

@Injectable({
  providedIn: 'root',
})
export class LoteService {
  private apiUrl = `${environment.apiUrl}/lotes`;

  constructor(private http: HttpClient) {}

  getLotes(
    params?: PaginationParams & Partial<FilterLoteParams>
  ): Observable<PaginatedResponse<Lote>> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const val = (params as any)[key];
        if (
          val !== undefined &&
          val !== null &&
          val !== '' &&
          val !== 'null' &&
          val !== 'undefined'
        ) {
          httpParams = httpParams.set(key, val.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<Lote>>(this.apiUrl, { params: httpParams });
  }

  getLote(id: number): Observable<Lote> {
    return this.http.get<Lote>(`${this.apiUrl}/${id}`);
  }

  createLote(lote: Partial<Lote>): Observable<Lote> {
    return this.http.post<Lote>(this.apiUrl, lote);
  }

  updateLote(id: number, lote: Partial<Lote>): Observable<Lote> {
    return this.http.patch<Lote>(`${this.apiUrl}/${id}`, lote);
  }

  deleteLote(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  toggleActivo(id: number): Observable<Lote> {
    return this.http.post<Lote>(`${this.apiUrl}/${id}/toggle`, {});
  }
}
