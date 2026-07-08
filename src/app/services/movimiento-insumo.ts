import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class MovimientoInsumoService {
  private apiUrl = `${environment.apiUrl}/movimientos-insumo`;

  constructor(private http: HttpClient, private toast: ToastService) {}

  getMovimientos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createMovimiento(movimiento: {
    fecha: string | Date;
    cantidad: number;
    tipo_movimiento: string;
    observaciones?: string;
    insumo_id: string;
    lote_id: string;
    creado_por: string;
  }): Observable<any> {
    return this.http.post<any>(this.apiUrl, movimiento).pipe(
      catchError((err: any) => {
        const msg = err?.error?.message || err?.message || 'Error al crear movimiento de insumo';
        this.toast.error(msg, 'Error');
        return throwError(() => err);
      })
    );
  }

  deleteMovimiento(uuid: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${uuid}`).pipe(
      catchError((err: any) => {
        const msg = err?.error?.message || err?.message || 'Error al eliminar movimiento de insumo';
        this.toast.error(msg, 'Error');
        return throwError(() => err);
      })
    );
  }
}
