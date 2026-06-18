import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { TipoAlimentoService } from '../../services/tipo-alimento';
import { UnidadMedidaService } from '../../services/unidad-medida';
import { RazaService } from '../../services/raza';
import { Alimento, TipoAlimento, UnidadMedida } from '../../interfaces/alimento.interface';
import { Raza } from '../../interfaces/raza.interface';
import { AuthService } from '../../services/auth.service';
import { AlertaService } from '../../services/alerta';
import { AlimentoService } from '../../services/alimento';
import { GalponService } from '../../services/galpon.service';
import { LoteService } from '../../services/lote';
import { MuerteService } from '../../services/muerte';
import { Alerta } from '../../interfaces/alerta.interface';
import { Galpon } from '../../interfaces/galpon.interface';
import { Lote } from '../../interfaces/lote.interface';
import { Muerte } from '../../interfaces/muerte.interface';

type ConfigTab = 'alertas' | 'tipos-alimento' | 'unidades-medida' | 'razas';

interface Settings {
  maxMortalityRate: number;
  minPosturaRate: number;
  feedPerHen: number;
  stockCriticalPercent: number;
  maxOccupancyRate: number;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class Configuracion implements OnInit {
  activeTab: ConfigTab = 'alertas';
  saveSuccess = false;
  error: string | null = null;
  loading = false;
  guardando = false;
  evaluatingAlerts = false;
  generatedAlertsCount: number | null = null;
  auth = inject(AuthService);

  // Listas de catálogos
  tiposAlimento: TipoAlimento[] = [];
  unidadesMedida: UnidadMedida[] = [];
  razas: Raza[] = [];

  // Modales y formularios
  mostrarModalTipo = false;
  tipoEditando: TipoAlimento | null = null;
  tipoForm = { nombre: '' };

  mostrarModalUnidad = false;
  unidadEditando: UnidadMedida | null = null;
  unidadForm = { nombre: '', abreviatura: '' };

  mostrarModalRaza = false;
  razaEditando: Raza | null = null;
  razaForm = { nombre_raza: '', activo: true };

  // Settings form for alert thresholds
  settings: Settings = {
    maxMortalityRate: 5,
    minPosturaRate: 70,
    feedPerHen: 120,
    stockCriticalPercent: 100,
    maxOccupancyRate: 95,
  };

  private readonly settingsKey = 'laying_hens_alert_thresholds';

  constructor(
    private tipoAlimentoService: TipoAlimentoService,
    private unidadMedidaService: UnidadMedidaService,
    private razaService: RazaService,
    private alertaService: AlertaService,
    private alimentoService: AlimentoService,
    private galponService: GalponService,
    private loteService: LoteService,
    private muerteService: MuerteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSettings();
    this.loadAll();
  }

  loadAll(): void {
    this.loadTiposAlimento();
    this.loadUnidadesMedida();
    this.loadRazas();
  }

  setTab(tab: ConfigTab): void {
    this.activeTab = tab;
    this.error = null;
    this.generatedAlertsCount = null;
  }

  loadSettings(): void {
    const saved = localStorage.getItem(this.settingsKey);
    if (!saved) return;

    try {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    } catch (err) {
      console.error('Error al cargar umbrales de alertas:', err);
    }
  }

  // --- CRUD TIPOS DE ALIMENTO ---
  loadTiposAlimento(): void {
    this.loading = true;
    this.tipoAlimentoService.getTiposAlimento().subscribe({
      next: (res) => {
        this.tiposAlimento = res || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar tipos de alimento';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalCrearTipo(): void {
    this.tipoEditando = null;
    this.tipoForm = { nombre: '' };
    this.mostrarModalTipo = true;
    this.cdr.detectChanges();
  }

  abrirModalEditarTipo(t: TipoAlimento): void {
    this.tipoEditando = t;
    this.tipoForm = { nombre: t.nombre };
    this.mostrarModalTipo = true;
    this.cdr.detectChanges();
  }

  cerrarModalTipo(): void {
    this.mostrarModalTipo = false;
    this.guardando = false;
    this.cdr.detectChanges();
  }

  guardarTipoAlimento(): void {
    if (this.guardando) return;
    this.guardando = true;

    const action = this.tipoEditando
      ? this.tipoAlimentoService.updateTipoAlimento(this.tipoEditando.id_tipo_insumo, this.tipoForm)
      : this.tipoAlimentoService.createTipoAlimento(this.tipoForm);

    action.subscribe({
      next: () => {
        this.cerrarModalTipo();
        this.loadTiposAlimento();
        this.showSuccessToast();
      },
      error: () => {
        this.error = 'Error al guardar tipo de alimento';
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  eliminarTipoAlimento(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este tipo de alimento? (Nota: Puede fallar si está en uso por insumos existentes)')) {
      this.tipoAlimentoService.deleteTipoAlimento(id).subscribe({
        next: () => {
          this.loadTiposAlimento();
          this.showSuccessToast();
        },
        error: () => {
          this.error = 'Error al eliminar. No se puede borrar porque está en uso por otros insumos.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  // --- CRUD UNIDADES DE MEDIDA ---
  loadUnidadesMedida(): void {
    this.loading = true;
    this.unidadMedidaService.getUnidadesMedida().subscribe({
      next: (res) => {
        this.unidadesMedida = res || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar unidades de medida';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalCrearUnidad(): void {
    this.unidadEditando = null;
    this.unidadForm = { nombre: '', abreviatura: '' };
    this.mostrarModalUnidad = true;
    this.cdr.detectChanges();
  }

  abrirModalEditarUnidad(u: UnidadMedida): void {
    this.unidadEditando = u;
    this.unidadForm = { nombre: u.nombre, abreviatura: u.abreviatura };
    this.mostrarModalUnidad = true;
    this.cdr.detectChanges();
  }

  cerrarModalUnidad(): void {
    this.mostrarModalUnidad = false;
    this.guardando = false;
    this.cdr.detectChanges();
  }

  guardarUnidadMedida(): void {
    if (this.guardando) return;
    this.guardando = true;

    const action = this.unidadEditando
      ? this.unidadMedidaService.updateUnidadMedida(this.unidadEditando.id_unidad, this.unidadForm)
      : this.unidadMedidaService.createUnidadMedida(this.unidadForm);

    action.subscribe({
      next: () => {
        this.cerrarModalUnidad();
        this.loadUnidadesMedida();
        this.showSuccessToast();
      },
      error: () => {
        this.error = 'Error al guardar unidad de medida';
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  eliminarUnidadMedida(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar esta unidad de medida? (Nota: Puede fallar si está en uso por insumos existentes)')) {
      this.unidadMedidaService.deleteUnidadMedida(id).subscribe({
        next: () => {
          this.loadUnidadesMedida();
          this.showSuccessToast();
        },
        error: () => {
          this.error = 'Error al eliminar. No se puede borrar porque está en uso por otros insumos.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  // --- CRUD RAZAS ---
  loadRazas(): void {
    this.loading = true;
    this.razaService.getRazasAll().subscribe({
      next: (res) => {
        this.razas = res || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar razas:', err);
        this.error = 'Error al cargar razas';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleRazaStatus(raza: Raza): void {
    const nuevoEstado = !raza.activo;
    this.razaService.updateRaza(raza.id_raza, { activo: nuevoEstado }).subscribe({
      next: () => {
        raza.activo = nuevoEstado;
        this.showSuccessToast();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cambiar estado de raza:', err);
      }
    });
  }

  abrirModalCrearRaza(): void {
    this.razaEditando = null;
    this.razaForm = { nombre_raza: '', activo: true };
    this.mostrarModalRaza = true;
    this.cdr.detectChanges();
  }

  abrirModalEditarRaza(raza: Raza): void {
    this.razaEditando = raza;
    this.razaForm = { nombre_raza: raza.nombre_raza, activo: raza.activo };
    this.mostrarModalRaza = true;
    this.cdr.detectChanges();
  }

  cerrarModalRaza(): void {
    this.mostrarModalRaza = false;
    this.guardando = false;
    this.cdr.detectChanges();
  }

  guardarRaza(): void {
    if (this.guardando) return;
    this.guardando = true;

    const payload: Partial<Raza> = {
      nombre_raza: this.razaForm.nombre_raza,
      activo: this.razaForm.activo
    };

    const action = this.razaEditando
      ? this.razaService.updateRaza(this.razaEditando.id_raza, payload)
      : this.razaService.createRaza(payload);

    action.subscribe({
      next: () => {
        this.cerrarModalRaza();
        this.loadRazas();
        this.showSuccessToast();
      },
      error: (err) => {
        console.error('Error al guardar raza:', err);
        this.error = 'Error al guardar raza';
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  eliminarRaza(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar esta raza?')) {
      this.razaService.deleteRaza(id).subscribe({
        next: () => {
          this.loadRazas();
          this.showSuccessToast();
        },
        error: (err) => {
          console.error('Error al eliminar raza:', err);
          const errorMsg = err.error?.message || 'No se pudo eliminar la raza.';
          this.error = Array.isArray(errorMsg) ? errorMsg.join('\n') : errorMsg;
          this.cdr.detectChanges();
        }
      });
    }
  }

  saveSettings(): void {
    localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
    this.saveSuccess = true;
    setTimeout(() => {
      this.saveSuccess = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  evaluarYGenerarAlertas(): void {
    if (this.evaluatingAlerts) return;

    this.saveSettings();
    this.evaluatingAlerts = true;
    this.generatedAlertsCount = null;
    this.error = null;

    forkJoin({
      lotes: this.loteService.getLotes({ limit: 1000 }).pipe(catchError(() => of({ data: [] }))),
      muertes: this.muerteService.getMuertes({ limit: 1000 }).pipe(catchError(() => of({ data: [] }))),
      alimentos: this.alimentoService.getAlimentos({ limit: 1000 }).pipe(catchError(() => of({ data: [] }))),
      galpones: this.galponService.getGalpones({ limit: 1000 }).pipe(catchError(() => of({ data: [] }))),
      alertas: this.alertaService.getAlertas({ limit: 1000, leida: false }).pipe(catchError(() => of({ data: [] }))),
    }).pipe(
      switchMap((res) => {
        const lotes = this.extractData<Lote>(res.lotes);
        const muertes = this.extractData<Muerte>(res.muertes);
        const alimentos = this.extractData<Alimento>(res.alimentos);
        const galpones = this.extractData<Galpon>(res.galpones);
        const alertas = this.extractData<Alerta>(res.alertas);
        const nuevasAlertas = this.buildAlertas(lotes, muertes, alimentos, galpones, alertas);

        if (nuevasAlertas.length === 0) {
          return of([]);
        }

        return forkJoin(nuevasAlertas.map((alerta) => this.alertaService.createAlerta(alerta)));
      })
    ).subscribe({
      next: (created) => {
        this.generatedAlertsCount = created.length;
        this.evaluatingAlerts = false;
        this.showSuccessToast();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al evaluar alertas:', err);
        this.error = 'No se pudieron evaluar o generar las alertas';
        this.evaluatingAlerts = false;
        this.cdr.detectChanges();
      }
    });
  }

  private extractData<T>(response: unknown): T[] {
    if (Array.isArray(response)) return response as T[];
    const data = (response as { data?: T[] })?.data;
    return Array.isArray(data) ? data : [];
  }

  private buildAlertas(
    lotes: Lote[],
    muertes: Muerte[],
    alimentos: Alimento[],
    galpones: Galpon[],
    existingAlerts: Alerta[]
  ): Partial<Alerta>[] {
    const propuestas: Partial<Alerta>[] = [];

    lotes.forEach((lote) => {
      const loteId = lote.id_lote;
      const nombreLote = `Lote #${loteId}`;

      if (Number(lote.produccion_pct) < this.settings.minPosturaRate) {
        propuestas.push({
          titulo: `Postura baja en ${nombreLote}`,
          mensaje: `La postura actual es ${lote.produccion_pct}% y está por debajo del mínimo configurado de ${this.settings.minPosturaRate}%.`,
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

      if (totalGallinas > 0 && mortalidad > this.settings.maxMortalityRate) {
        propuestas.push({
          titulo: `Mortalidad alta en ${nombreLote}`,
          mensaje: `La mortalidad acumulada es ${mortalidad.toFixed(2)}% (${muertesLote} bajas de ${totalGallinas} aves), por encima del máximo configurado de ${this.settings.maxMortalityRate}%.`,
          tipo: 'salud',
          prioridad: 'alta',
          lote_id: loteId,
        });
      }
    });

    alimentos.forEach((alimento) => {
      const limiteStock = Number(alimento.stock_minimo || 0) * (this.settings.stockCriticalPercent / 100);
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

      if (capacidad > 0 && ocupacion >= this.settings.maxOccupancyRate) {
        propuestas.push({
          titulo: `Ocupación alta en ${galpon.nombre}`,
          mensaje: `El galpón tiene ${gallinas} aves de ${capacidad} cupos (${ocupacion.toFixed(2)}%), superando el umbral de ${this.settings.maxOccupancyRate}%.`,
          tipo: 'infraestructura',
          prioridad: 'media',
          galpon_id: galpon.id_galpon,
        });
      }
    });

    return propuestas.filter((propuesta) => !this.alertaDuplicada(propuesta, existingAlerts));
  }

  private alertaDuplicada(propuesta: Partial<Alerta>, existingAlerts: Alerta[]): boolean {
    return existingAlerts.some((alerta) =>
      !alerta.leida &&
      alerta.titulo === propuesta.titulo &&
      alerta.tipo === propuesta.tipo &&
      (alerta.lote_id ?? null) === (propuesta.lote_id ?? null) &&
      (alerta.galpon_id ?? null) === (propuesta.galpon_id ?? null)
    );
  }

  showSuccessToast(): void {
    this.saveSuccess = true;
    setTimeout(() => {
      this.saveSuccess = false;
      this.cdr.detectChanges();
    }, 3000);
  }
}
