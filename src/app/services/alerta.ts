import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Alerta, FilterAlertaParams } from '../interfaces/alerta.interface';
import { PaginatedResponse, PaginationParams } from '../interfaces/pagination.interface';

@Injectable({
  providedIn: 'root',
})
export class AlertaService {
  private apiUrl = `${environment.apiUrl}/alertas`;

  constructor(private http: HttpClient) {}

  getAlertas(
    params?: PaginationParams & Partial<FilterAlertaParams>
  ): Observable<PaginatedResponse<Alerta>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sortBy !== undefined) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.order !== undefined) httpParams = httpParams.set('order', params.order);
      
      if (params.tipo !== undefined && params.tipo !== null) {
        httpParams = httpParams.set('tipo', params.tipo);
      }
      if (params.prioridad !== undefined && params.prioridad !== null) {
        httpParams = httpParams.set('prioridad', params.prioridad);
      }
      if (params.leida !== undefined && params.leida !== null) {
        httpParams = httpParams.set('leida', params.leida.toString());
      }
    }

    return this.http.get<PaginatedResponse<Alerta>>(this.apiUrl, { params: httpParams });
  }

  getAlerta(id: number): Observable<Alerta> {
    return this.http.get<Alerta>(`${this.apiUrl}/${id}`);
  }

  createAlerta(alerta: Partial<Alerta>): Observable<Alerta> {
    return this.http.post<Alerta>(this.apiUrl, alerta);
  }

  updateAlerta(id: number, alerta: Partial<Alerta>): Observable<Alerta> {
    return this.http.patch<Alerta>(`${this.apiUrl}/${id}`, alerta);
  }

  deleteAlerta(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  markAsRead(id: number): Observable<Alerta> {
    return this.updateAlerta(id, { leida: true });
  }

  markAsUnread(id: number): Observable<Alerta> {
    return this.updateAlerta(id, { leida: false });
  }
}
