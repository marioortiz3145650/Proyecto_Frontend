import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Galpon, FilterGalponParams } from '../interfaces/galpon.interface';
import { PaginatedResponse, PaginationParams } from '../interfaces/pagination.interface';

@Injectable({
  providedIn: 'root'
})
export class GalponService {
  private apiUrl = `${environment.apiUrl}/galpones`;

  constructor(private http: HttpClient) {}

  getGalpones(
    params?: PaginationParams & Partial<FilterGalponParams>
  ): Observable<PaginatedResponse<Galpon>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sortBy !== undefined) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.order !== undefined) httpParams = httpParams.set('order', params.order);
      if (params.nombre !== undefined) httpParams = httpParams.set('nombre', params.nombre);
      if (params.direccion !== undefined) httpParams = httpParams.set('direccion', params.direccion);
      if (params.lote !== undefined) httpParams = httpParams.set('lote', params.lote.toString());
    }

    return this.http.get<PaginatedResponse<Galpon>>(this.apiUrl, { params: httpParams });
  }

  getGalpon(id: string): Observable<Galpon> {
    return this.http.get<Galpon>(`${this.apiUrl}/${id}`);
  }

  createGalpon(galpon: Partial<Galpon>): Observable<Galpon> {
    return this.http.post<Galpon>(this.apiUrl, galpon);
  }

  updateGalpon(id: string, galpon: Partial<Galpon>): Observable<Galpon> {
    return this.http.patch<Galpon>(`${this.apiUrl}/${id}`, galpon);
  }
}