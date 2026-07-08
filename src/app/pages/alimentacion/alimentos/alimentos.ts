import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlimentoService } from '../../../services/alimento';
import { TipoAlimentoService } from '../../../services/tipo-alimento';
import { UnidadMedidaService } from '../../../services/unidad-medida';
import { Alimento, TipoAlimento, UnidadMedida, FilterAlimentoParams } from '../../../interfaces/alimento.interface';
import { PaginationMeta, PaginationParams } from '../../../interfaces/pagination.interface';
import { AuthService } from '../../../services/auth.service';
import { AlertaService } from '../../../services/alerta';
import { ToastService } from '../../../services/toast.service';
import { DialogService } from '../../../services/dialog.service';
import { PaginationComponent } from '../../../components/pagination/pagination.component';

@Component({
  selector: 'app-alimentos',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './alimentos.html',
  styleUrl: './alimentos.css',
})
export class Alimentos implements OnInit {
  alimentos: Alimento[] = [];
  tiposAlimento: TipoAlimento[] = [];
  unidadesMedida: UnidadMedida[] = [];
  auth = inject(AuthService);
  private alertaService = inject(AlertaService);
  meta: PaginationMeta = {
    total: 0, page: 1, limit: 5, totalPages: 0, hasNext: false, hasPrev: false,
  };

  page = 1;
  limit = 5;
  sortBy = 'id_insumo';
  sortOrder: 'ASC' | 'DESC' = 'ASC';

  filtros: FilterAlimentoParams = {};
  loading = false;
  guardando = false;
  error: string | null = null;
  Math = Math;

  mostrarModal = false;
  alimentoEditando: Alimento | null = null;
  alimentoForm: {
    nombre: string;
    tipo_alimento_id?: string;
    unidad_medida_id?: string;
    stock_actual: number;
    stock_minimo: number;
  } = {
    nombre: '',
    stock_actual: 0,
    stock_minimo: 0,
  };

  mostrarModalTipo = false;
  nuevoTipoForm = { nombre: '' };

  mostrarModalUnidad = false;
  nuevoUnidadForm = { nombre: '', abreviatura: '' };

  constructor(
    private alimentoService: AlimentoService,
    private tipoAlimentoService: TipoAlimentoService,
    private unidadMedidaService: UnidadMedidaService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private dialog: DialogService
  ) {}

  ngOnInit(): void {
    this.loadTiposAlimento();
    this.loadUnidadesMedida();
    this.loadAlimentos();
  }

  loadTiposAlimento(): void {
    this.tipoAlimentoService.getTiposAlimento().subscribe({
      next: (data) => { this.tiposAlimento = data; this.cdr.detectChanges(); },
      error: () => { this.error = 'Error al cargar tipos de alimento'; this.cdr.detectChanges(); }
    });
  }

  loadUnidadesMedida(): void {
    this.unidadMedidaService.getUnidadesMedida().subscribe({
      next: (data) => { this.unidadesMedida = data; this.cdr.detectChanges(); },
      error: () => { this.error = 'Error al cargar unidades de medida'; this.cdr.detectChanges(); }
    });
  }

  loadAlimentos(): void {
    this.loading = true;
    this.error = null;

    const params: PaginationParams & Partial<FilterAlimentoParams> = {
      page: this.page,
      limit: this.limit,
      sortBy: this.sortBy,
      order: this.sortOrder,
    };

    if (this.filtros.id_insumo !== undefined && this.filtros.id_insumo !== null) {
      params.id_insumo = this.filtros.id_insumo;
    }
    if (this.filtros.tipo_alimento !== undefined && this.filtros.tipo_alimento !== null) {
      params.tipo_alimento = this.filtros.tipo_alimento;
    }
    if (this.filtros.unidad_medida !== undefined && this.filtros.unidad_medida !== null) {
      params.unidad_medida = this.filtros.unidad_medida;
    }

    this.alimentoService.getAlimentos(params).subscribe({
      next: (response) => {
        this.alimentos = response.data;
        this.meta = response.meta;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar alimentos';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  applyFilters(): void { this.page = 1; this.loadAlimentos(); }
  clearFilters(): void { this.filtros = {}; this.page = 1; this.loadAlimentos(); }

  sortByField(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortOrder = 'ASC';
    }
    this.loadAlimentos();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.meta.totalPages) return;
    this.page = page;
    this.loadAlimentos();
  }

  changeLimit(newLimit?: number): void { if (newLimit !== undefined) this.limit = newLimit; this.page = 1; this.loadAlimentos(); }

  abrirModalCrear(): void {
    if (this.auth.isVisitante()) return;
    this.alimentoEditando = null;
    this.guardando = false;
    this.alimentoForm = {
      nombre: '',
      tipo_alimento_id: this.tiposAlimento.length > 0 ? this.tiposAlimento[0].uuid : undefined,
      unidad_medida_id: this.unidadesMedida.length > 0 ? this.unidadesMedida[0].uuid : undefined,
      stock_actual: 0,
      stock_minimo: 0,
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  abrirModalEditar(alimento: Alimento): void {
    if (this.auth.isVisitante()) return;
    this.alimentoEditando = alimento;
    this.guardando = false;
    this.alimentoForm = {
      nombre: alimento.nombre,
      tipo_alimento_id: alimento.tipo_alimento?.uuid,
      unidad_medida_id: alimento.unidad_medida?.uuid,
      stock_actual: Number(alimento.stock_actual),
      stock_minimo: Number(alimento.stock_minimo),
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void { this.mostrarModal = false; this.guardando = false; this.cdr.detectChanges(); }

  abrirModalTipo(): void {
    if (this.auth.isVisitante()) return;
    this.nuevoTipoForm = { nombre: '' };
    this.mostrarModalTipo = true;
    this.cdr.detectChanges();
  }
  cerrarModalTipo(): void { this.mostrarModalTipo = false; this.cdr.detectChanges(); }

  guardarTipoAlimento(): void {
    if (this.auth.isVisitante()) return;
    if (!this.nuevoTipoForm.nombre.trim()) return;
    this.tipoAlimentoService.createTipoAlimento({ nombre: this.nuevoTipoForm.nombre }).subscribe({
      next: (tipo) => {
        this.loadTiposAlimento();
        this.alimentoForm.tipo_alimento_id = tipo.uuid;
        this.cerrarModalTipo();
      },
      error: () => { this.error = 'Error al crear tipo de alimento'; this.cdr.detectChanges(); }
    });
  }

  abrirModalUnidad(): void {
    if (this.auth.isVisitante()) return;
    this.nuevoUnidadForm = { nombre: '', abreviatura: '' };
    this.mostrarModalUnidad = true;
    this.cdr.detectChanges();
  }
  cerrarModalUnidad(): void { this.mostrarModalUnidad = false; this.cdr.detectChanges(); }

  guardarUnidadMedida(): void {
    if (this.auth.isVisitante()) return;
    if (!this.nuevoUnidadForm.nombre.trim() || !this.nuevoUnidadForm.abreviatura.trim()) return;
    this.unidadMedidaService.createUnidadMedida({
      nombre: this.nuevoUnidadForm.nombre,
      abreviatura: this.nuevoUnidadForm.abreviatura
    }).subscribe({
      next: (unidad) => {
        this.loadUnidadesMedida();
        this.alimentoForm.unidad_medida_id = unidad.uuid;
        this.cerrarModalUnidad();
      },
      error: () => { this.error = 'Error al crear unidad de medida'; this.cdr.detectChanges(); }
    });
  }

  guardarAlimento(): void {
    if (this.auth.isVisitante()) return;
    if (this.guardando) return;
    if (!this.alimentoForm.tipo_alimento_id || !this.alimentoForm.unidad_medida_id) return;

    this.guardando = true;

    const payload = {
      nombre: this.alimentoForm.nombre,
      tipo_alimento_id: this.alimentoForm.tipo_alimento_id,
      unidad_medida_id: this.alimentoForm.unidad_medida_id,
      stock_actual: Number(this.alimentoForm.stock_actual),
      stock_minimo: Number(this.alimentoForm.stock_minimo),
    };

    if (this.alimentoEditando) {
      this.alimentoService.updateAlimento(this.alimentoEditando.uuid!, payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.loadAlimentos();
          this.alertaService.evaluarYGenerarAlertas().subscribe();
          this.toast.success('Alimento actualizado correctamente.');
        },
        error: (err) => {
          this.showBackendError(err);
          this.guardando = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      this.alimentoService.createAlimento(payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.loadAlimentos();
          this.alertaService.evaluarYGenerarAlertas().subscribe();
          this.toast.success('Alimento registrado correctamente.');
        },
        error: (err) => {
          this.showBackendError(err);
          this.guardando = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  eliminarAlimento(uuid: string): void {
    if (this.auth.isVisitante()) return;
    this.dialog.confirmDelete(
      'Esta acción puede afectar a otros procesos o registros vinculados.',
      '¿Eliminar este alimento/insumo?',
      'alimento/insumo'
    ).subscribe((confirmado) => {
      if (!confirmado) return;
      this.alimentoService.deleteAlimento(uuid).subscribe({
        next: () => {
          this.loadAlimentos();
          this.alertaService.evaluarYGenerarAlertas().subscribe();
          this.toast.success('Alimento eliminado correctamente.', 'Eliminado');
        },
        error: (err) => {
          this.showBackendError(err);
          this.cdr.detectChanges();
        },
      });
    });
  }

  get alimentosVisibles(): Alimento[] {
    return this.alimentos.filter(a => {
      const stock = Number(a.stock_actual);
      return !Number.isNaN(stock) && stock > 0;
    });
  }

  private showBackendError(err: any): void {
    const msg = err?.error?.message || err?.message || 'Error al registrar alimento';
    this.toast.error(msg, 'Error');
  }
}
