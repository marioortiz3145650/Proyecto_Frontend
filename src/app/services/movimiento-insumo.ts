import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MovimientoInsumoService {
  private apiUrl = `${environment.apiUrl}/movimientos-insumo`;

  constructor(private http: HttpClient) {}

  getMovimientos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createMovimiento(movimiento: {
    fecha: string | Date;
    cantidad: number;
    tipo_movimiento: string;
    observaciones?: string;
    insumo_id: number;
    lote_id: number;
    creado_por: string;
  }): Observable<any> {
    return this.http.post<any>(this.apiUrl, movimiento);
  }

  deleteMovimiento(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
