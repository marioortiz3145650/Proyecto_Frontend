import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Alerta, FilterAlertaParams } from '../interfaces/alerta.interface';
import { PaginatedResponse, PaginationParams } from '../interfaces/pagination.interface';

// Services
import { LoteService } from './lote';
import { MuerteService } from './muerte';
import { AlimentoService } from './alimento';
import { GalponService } from './galpon.service';

// Interfaces
import { Lote } from '../interfaces/lote.interface';
import { Muerte } from '../interfaces/muerte.interface';
import { Alimento } from '../interfaces/alimento.interface';
import { Galpon } from '../interfaces/galpon.interface';

@Injectable({
  providedIn: 'root',
})
export class AlertaService {
  private apiUrl = `${environment.apiUrl}/alertas`;

  private refreshCountSubject = new BehaviorSubject<void>(undefined);
  refreshCount$ = this.refreshCountSubject.asObservable();

  private loteService = inject(LoteService);
  private muerteService = inject(MuerteService);
  private alimentoService = inject(AlimentoService);
  private galponService = inject(GalponService);

  constructor(private http: HttpClient) {}

  triggerRefresh(): void {
    this.refreshCountSubject.next();
  }

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
    return this.http.post<Alerta>(this.apiUrl, alerta).pipe(
      tap(() => this.triggerRefresh())
    );
  }

  updateAlerta(id: number, alerta: Partial<Alerta>): Observable<Alerta> {
    return this.http.patch<Alerta>(`${this.apiUrl}/${id}`, alerta).pipe(
      tap(() => this.triggerRefresh())
    );
  }

  deleteAlerta(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.triggerRefresh())
    );
  }

  markAsRead(id: number): Observable<Alerta> {
    return this.updateAlerta(id, { leida: true });
  }

  markAsUnread(id: number): Observable<Alerta> {
    return this.updateAlerta(id, { leida: false });
  }

  evaluarYGenerarAlertas(): Observable<Alerta[]> {
    let settings = {
      maxMortalityRate: 5,
      minPosturaRate: 70,
      feedPerHen: 120,
      stockCriticalPercent: 100,
      maxOccupancyRate: 95,
    };
    const saved = localStorage.getItem('laying_hens_alert_thresholds');
    if (saved) {
      try {
        settings = JSON.parse(saved);
      } catch (e) {}
    }

    return forkJoin({
      lotes: this.loteService.getLotes({ limit: 1000 }).pipe(catchError(() => of({ data: [] }))),
      muertes: this.muerteService.getMuertes({ limit: 1000 }).pipe(catchError(() => of({ data: [] }))),
      alimentos: this.alimentoService.getAlimentos({ limit: 1000 }).pipe(catchError(() => of({ data: [] }))),
      galpones: this.galponService.getGalpones({ limit: 1000 }).pipe(catchError(() => of({ data: [] }))),
      alertas: this.getAlertas({ limit: 1000, leida: false }).pipe(catchError(() => of({ data: [] }))),
    }).pipe(
      switchMap((res) => {
        const lotes = this.extractData<Lote>(res.lotes);
        const muertes = this.extractData<Muerte>(res.muertes);
        const alimentos = this.extractData<Alimento>(res.alimentos);
        const galpones = this.extractData<Galpon>(res.galpones);
        const alertas = this.extractData<Alerta>(res.alertas);

        const propuestas: Partial<Alerta>[] = [];

        lotes.forEach((lote) => {
          const loteId = lote.id_lote;
          const nombreLote = `Lote #${loteId}`;

          if (Number(lote.produccion_pct) < settings.minPosturaRate) {
            propuestas.push({
              titulo: `Postura baja en ${nombreLote}`,
              mensaje: `La postura actual es ${lote.produccion_pct}% y está por debajo del mínimo configurado de ${settings.minPosturaRate}%.`,
              tipo: 'produccion',
              prioridad: 'alta',
              lote_id: loteId,
            });
          }

          const totalGallinas = Number(lote.total_gallinas || 0);
          const muertesLote = muertes
            .filter((muerte) => muerte.lote?.id_lote === loteId)
            .reduce((total, muerte) => total + Number(muerte.cantidad || 0), 0);
          const mortalidad = totalGallinas > 0 ? (muertesLote / totalGallinas) * 100 : 0;

          if (totalGallinas > 0 && mortalidad > settings.maxMortalityRate) {
            propuestas.push({
              titulo: `Mortalidad alta en ${nombreLote}`,
              mensaje: `La mortalidad acumulada es ${mortalidad.toFixed(2)}% (${muertesLote} bajas de ${totalGallinas} aves), por encima del máximo configurado de ${settings.maxMortalityRate}%.`,
              tipo: 'salud',
              prioridad: 'alta',
              lote_id: loteId,
            });
          }
        });

        alimentos.forEach((alimento) => {
          const limiteStock = Number(alimento.stock_minimo || 0) * (settings.stockCriticalPercent / 100);
          if (Number(alimento.stock_actual || 0) <= limiteStock) {
            propuestas.push({
              titulo: `Stock crítico de ${alimento.nombre}`,
              mensaje: `El stock actual es ${alimento.stock_actual} y el mínimo configurado del insumo es ${alimento.stock_minimo}.`,
              tipo: 'stock',
              prioridad: Number(alimento.stock_actual || 0) <= 0 ? 'alta' : 'media',
            });
          }
        });

        galpones.forEach((galpon) => {
          const capacidad = Number(galpon.capacidad || 0);
          const gallinas = Number(galpon.gallinasActuales || 0);
          const ocupacion = capacidad > 0 ? (gallinas / capacidad) * 100 : 0;

          if (capacidad > 0 && ocupacion >= settings.maxOccupancyRate) {
            propuestas.push({
              titulo: `Ocupación alta en ${galpon.nombre}`,
              mensaje: `El galpón tiene ${gallinas} aves de ${capacidad} cupos (${ocupacion.toFixed(2)}%), superando el umbral de ${settings.maxOccupancyRate}%.`,
              tipo: 'infraestructura',
              prioridad: 'media',
              galpon_id: galpon.id_galpon,
            });
          }
        });

        const nuevasAlertas = propuestas.filter((propuesta) => {
          return !alertas.some((alerta) =>
            !alerta.leida &&
            alerta.titulo === propuesta.titulo &&
            alerta.tipo === propuesta.tipo &&
            (alerta.lote_id ?? null) === (propuesta.lote_id ?? null) &&
            (alerta.galpon_id ?? null) === (propuesta.galpon_id ?? null)
          );
        });

        if (nuevasAlertas.length === 0) {
          return of([]);
        }

        return forkJoin(nuevasAlertas.map((alerta) => this.createAlerta(alerta)));
      })
    );
  }

  private extractData<T>(response: any): T[] {
    if (Array.isArray(response)) return response as T[];
    const data = (response as { data?: T[] })?.data;
    return Array.isArray(data) ? data : [];
  }
}
