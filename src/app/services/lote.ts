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
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sortBy !== undefined) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.order !== undefined) httpParams = httpParams.set('order', params.order);
      if (params.edad_semanas !== undefined) httpParams = httpParams.set('edad_semanas', params.edad_semanas.toString());
      if (params.raza_id !== undefined) httpParams = httpParams.set('raza_id', params.raza_id.toString());
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
}
