import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReporteQuery {
  fecha_inicio?: string;
  fecha_fin?: string;
  lote_id?: string;
}

export interface ProduccionDia {
  fecha: string;
  total: number;
  jumbo: number;
  aaa: number;
  aa: number;
  a: number;
  b: number;
  c: number;
}

export interface LoteResumen {
  id_lote: number;
  raza: string;
  gallinas: number;
  produccion: number;
  mortalidad: number;
  consumo: number;
}

export interface ReporteResumen {
  totalProduccion: number;
  promedioDiario: number;
  totalConsumoAlimento: number;
  totalMuerte: number;
  tasaMortalidad: number;
  produccionPorDia: ProduccionDia[];
  mortalidadPorCausa: { causa: string; cantidad: number }[];
  resumenLotes: LoteResumen[];
}

@Injectable({
  providedIn: 'root',
})
export class ReportesService {
  private apiUrl = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  getResumen(query: ReporteQuery): Observable<ReporteResumen> {
    let params = new HttpParams();
    if (query.fecha_inicio) params = params.set('fecha_inicio', query.fecha_inicio);
    if (query.fecha_fin) params = params.set('fecha_fin', query.fecha_fin);
    if (query.lote_id !== undefined && query.lote_id !== null) {
      params = params.set('lote_id', String(query.lote_id));
    }
    return this.http.get<ReporteResumen>(`${this.apiUrl}/resumen`, { params });
  }
}
