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
import { ToastService } from '../../services/toast.service';
import { DialogService } from '../../services/dialog.service';
import { SettingsService, AlertThresholds } from '../../services/settings.service';

type ConfigTab = 'alertas' | 'tipos-alimento' | 'unidades-medida' | 'razas';

const DEFAULTS: AlertThresholds = {
  tasa_mortalidad_max: 5,
  postura_minima: 70,
  stock_critico_porcentaje: 100,
  ocupacion_maxima: 95,
};

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

  tiposAlimento: TipoAlimento[] = [];
  unidadesMedida: UnidadMedida[] = [];
  razas: Raza[] = [];

  mostrarModalTipo = false;
  tipoEditando: TipoAlimento | null = null;
  tipoForm = { nombre: '' };

  mostrarModalUnidad = false;
  unidadEditando: UnidadMedida | null = null;
  unidadForm = { nombre: '', abreviatura: '' };

  mostrarModalRaza = false;
  razaEditando: Raza | null = null;
  razaForm = { nombre_raza: '', activo: true };

  settings: AlertThresholds = { ...DEFAULTS };

  private settingsService = inject(SettingsService);

  constructor(
    private tipoAlimentoService: TipoAlimentoService,
    private unidadMedidaService: UnidadMedidaService,
    private razaService: RazaService,
    private alertaService: AlertaService,
    private alimentoService: AlimentoService,
    private galponService: GalponService,
    private loteService: LoteService,
    private muerteService: MuerteService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private dialog: DialogService
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
    this.settingsService.getAll().subscribe({
      next: (settings) => {
        this.settings = settings;
        this.cdr.detectChanges();
      },
      error: () => {
        this.settings = { ...DEFAULTS };
        this.cdr.detectChanges();
      }
    });
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
        this.toast.success(this.tipoEditando ? 'Tipo de alimento actualizado.' : 'Tipo de alimento creado correctamente.');
      },
      error: () => {
        this.toast.error('Error al guardar tipo de alimento.');
        this.error = 'Error al guardar tipo de alimento';
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  eliminarTipoAlimento(id: number): void {
    this.dialog.confirmDelete(
      'No se pudo eliminar. Puede estar en uso por otros insumos.',
      '¿Eliminar este tipo de alimento?',
      'tipo de alimento'
    ).subscribe((confirmado) => {
      if (!confirmado) return;
      this.tipoAlimentoService.deleteTipoAlimento(id).subscribe({
        next: () => {
          this.loadTiposAlimento();
          this.toast.success('Tipo de alimento eliminado.', 'Eliminado');
        },
        error: () => {
          this.toast.error('No se pudo eliminar. Puede estar en uso por otros insumos.');
          this.error = 'Error al eliminar. No se puede borrar porque está en uso por otros insumos.';
          this.cdr.detectChanges();
        }
      });
    });
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
        this.toast.success(this.unidadEditando ? 'Unidad de medida actualizada.' : 'Unidad de medida creada.');
      },
      error: () => {
        this.toast.error('Error al guardar unidad de medida.');
        this.error = 'Error al guardar unidad de medida';
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  eliminarUnidadMedida(id: number): void {
    this.dialog.confirmDelete(
      'No se pudo eliminar. Puede estar en uso por otros insumos.',
      '¿Eliminar esta unidad de medida?',
      'unidad de medida'
    ).subscribe((confirmado) => {
      if (!confirmado) return;
      this.unidadMedidaService.deleteUnidadMedida(id).subscribe({
        next: () => {
          this.loadUnidadesMedida();
          this.toast.success('Unidad de medida eliminada.', 'Eliminado');
        },
        error: () => {
          this.toast.error('No se pudo eliminar. Puede estar en uso por otros insumos.');
          this.error = 'Error al eliminar. No se puede borrar porque está en uso por otros insumos.';
          this.cdr.detectChanges();
        }
      });
    });
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
    this.razaService.updateRaza(raza.uuid!, { activo: nuevoEstado }).subscribe({
      next: () => {
        raza.activo = nuevoEstado;
        this.toast.success(`Raza ${nuevoEstado ? 'activada' : 'desactivada'} correctamente.`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cambiar estado de raza:', err);
        this.toast.error('No se pudo cambiar el estado de la raza.');
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
      ? this.razaService.updateRaza(this.razaEditando.uuid!, payload)
      : this.razaService.createRaza(payload);

    action.subscribe({
      next: () => {
        this.cerrarModalRaza();
        this.loadRazas();
        this.toast.success(this.razaEditando ? 'Raza actualizada.' : 'Raza creada correctamente.');
      },
      error: (err) => {
        console.error('Error al guardar raza:', err);
        this.toast.error('Error al guardar raza.');
        this.error = 'Error al guardar raza';
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  eliminarRaza(uuid: string): void {
    this.dialog.confirmDelete(
      'Esta acción puede afectar a otros procesos o registros vinculados.',
      '¿Eliminar esta raza?',
      'raza'
    ).subscribe((confirmado) => {
      if (!confirmado) return;
      this.razaService.deleteRaza(uuid).subscribe({
        next: () => {
          this.loadRazas();
          this.toast.success('Raza eliminada.', 'Eliminado');
        },
        error: (err) => {
          console.error('Error al eliminar raza:', err);
          this.toast.error('No se pudo eliminar la raza.');
          const errorMsg = err.error?.message || 'No se pudo eliminar la raza.';
          this.error = Array.isArray(errorMsg) ? errorMsg.join('\n') : errorMsg;
          this.cdr.detectChanges();
        }
      });
    });
  }

  saveSettings(): void {
    if (this.guardando) return;
    this.guardando = true;
    const ops = [
      this.settingsService.set('tasa_mortalidad_max', String(this.settings.tasa_mortalidad_max)),
      this.settingsService.set('postura_minima', String(this.settings.postura_minima)),
      this.settingsService.set('stock_critico_porcentaje', String(this.settings.stock_critico_porcentaje)),
      this.settingsService.set('ocupacion_maxima', String(this.settings.ocupacion_maxima)),
    ];

    forkJoin(ops).subscribe({
      next: () => {
        this.toast.success('Umbrales de alerta guardados correctamente.', 'Configuración');
        this.guardando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('No se pudieron guardar los umbrales.');
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
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
        this.toast.info(`Se generaron ${created.length} alerta(s) nuevas.`, 'Evaluación completada');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al evaluar alertas:', err);
        this.toast.error('No se pudieron evaluar o generar las alertas.', 'Error');
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
      const loteId = lote.uuid;
      const nombreLote = `Lote #${loteId}`;

      if (Number(lote.produccion_pct) < this.settings.postura_minima) {
        propuestas.push({
          titulo: `Postura baja en ${nombreLote}`,
          mensaje: `La postura actual es ${lote.produccion_pct}% y está por debajo del mínimo configurado de ${this.settings.postura_minima}%.`,
          tipo: 'produccion',
          prioridad: 'alta',
          lote_id: loteId,
        });
      }

      const totalGallinas = Number(lote.total_gallinas || 0);
      const muertesLote = muertes
        .filter((muerte) => muerte.lote?.uuid === loteId)
        .reduce((total, muerte) => total + Number(muerte.cantidad || 0), 0);
      const mortalidad = totalGallinas > 0 ? (muertesLote / totalGallinas) * 100 : 0;

      if (totalGallinas > 0 && mortalidad > this.settings.tasa_mortalidad_max) {
        propuestas.push({
          titulo: `Mortalidad alta en ${nombreLote}`,
          mensaje: `La mortalidad acumulada es ${mortalidad.toFixed(2)}% (${muertesLote} bajas de ${totalGallinas} aves), por encima del máximo configurado de ${this.settings.tasa_mortalidad_max}%.`,
          tipo: 'salud',
          prioridad: 'alta',
          lote_id: loteId,
        });
      }
    });

    alimentos.forEach((alimento) => {
      const limiteStock = Number(alimento.stock_minimo || 0) * (this.settings.stock_critico_porcentaje / 100);
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

      if (capacidad > 0 && ocupacion >= this.settings.ocupacion_maxima) {
        propuestas.push({
          titulo: `Ocupación alta en ${galpon.nombre}`,
          mensaje: `El galpón tiene ${gallinas} aves de ${capacidad} cupos (${ocupacion.toFixed(2)}%), superando el umbral de ${this.settings.ocupacion_maxima}%.`,
          tipo: 'infraestructura',
          prioridad: 'media',
          galpon_id: galpon.uuid ?? String(galpon.id_galpon),
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
}
