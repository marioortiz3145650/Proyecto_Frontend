import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AlertThresholds {
  tasa_mortalidad_max: number;
  postura_minima: number;
  stock_critico_porcentaje: number;
  ocupacion_maxima: number;
}

const DEFAULTS: AlertThresholds = {
  tasa_mortalidad_max: 5,
  postura_minima: 70,
  stock_critico_porcentaje: 100,
  ocupacion_maxima: 95,
};

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private apiUrl = `${environment.apiUrl}/settings`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<AlertThresholds> {
    return this.http.get<Record<string, string>>(this.apiUrl).pipe(
      map((record) => this.normalize(record)),
      catchError(() => of(DEFAULTS))
    );
  }

  get(key: string): Observable<string> {
    return this.http.get<{ key: string; value: string }>(`${this.apiUrl}/${encodeURIComponent(key)}`).pipe(
      map((item) => item.value),
      catchError(() => of(''))
    );
  }

  set(key: string, value: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${encodeURIComponent(key)}`, { value });
  }

  private normalize(record: Record<string, string>): AlertThresholds {
    return {
      tasa_mortalidad_max: Number(record['tasa_mortalidad_max'] ?? DEFAULTS.tasa_mortalidad_max),
      postura_minima: Number(record['postura_minima'] ?? DEFAULTS.postura_minima),
      stock_critico_porcentaje: Number(record['stock_critico_porcentaje'] ?? DEFAULTS.stock_critico_porcentaje),
      ocupacion_maxima: Number(record['ocupacion_maxima'] ?? DEFAULTS.ocupacion_maxima),
    };
  }
}
