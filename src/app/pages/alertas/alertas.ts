import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertaService } from '../../services/alerta';
import { LoteService } from '../../services/lote';
import { GalponService } from '../../services/galpon.service';
import { Alerta, FilterAlertaParams } from '../../interfaces/alerta.interface';
import { Lote } from '../../interfaces/lote.interface';
import { Galpon } from '../../interfaces/galpon.interface';
import { PaginationMeta, PaginationParams } from '../../interfaces/pagination.interface';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alertas.html',
  styleUrl: './alertas.css',
})
export class Alertas implements OnInit {
  alertas: Alerta[] = [];
  auth = inject(AuthService);
  lotes: Lote[] = [];
  galpones: Galpon[] = [];

  // Paginación y ordenamiento
  meta: PaginationMeta = {
    total: 0, page: 1, limit: 5, totalPages: 0, hasNext: false, hasPrev: false,
  };
  page = 1;
  limit = 5;
  sortBy = 'id_alerta';
  sortOrder: 'ASC' | 'DESC' = 'DESC';
  pages: number[] = [];

  loading = false;
  guardando = false;
  error: string | null = null;
  Math = Math;

  // Filtros
  filtros: FilterAlertaParams = {
    tipo: undefined,
    prioridad: undefined,
    leida: undefined,
  };

  // Creación de alerta
  mostrarModal = false;
  alertaForm: {
    titulo: string;
    mensaje: string;
    tipo: string;
    prioridad: string;
    lote_id?: number;
    galpon_id?: number;
  } = {
    titulo: '',
    mensaje: '',
    tipo: 'stock',
    prioridad: 'baja',
    lote_id: undefined,
    galpon_id: undefined,
  };

  constructor(
    private alertaService: AlertaService,
    private loteService: LoteService,
    private galponService: GalponService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAlertas();
    this.loadLotes();
    this.loadGalpones();
  }

  loadAlertas(): void {
    this.loading = true;
    this.error = null;

    const params: PaginationParams & Partial<FilterAlertaParams> = {
      page: this.page,
      limit: this.limit,
      sortBy: this.sortBy,
      order: this.sortOrder,
    };

    if (this.filtros.tipo !== undefined && this.filtros.tipo !== null) {
      params.tipo = this.filtros.tipo;
    }
    if (this.filtros.prioridad !== undefined && this.filtros.prioridad !== null) {
      params.prioridad = this.filtros.prioridad;
    }
    if (this.filtros.leida !== undefined && this.filtros.leida !== null) {
      params.leida = this.filtros.leida;
    }

    this.alertaService.getAlertas(params).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.alertas = response.data;
          this.meta = response.meta;
        } else if (Array.isArray(response)) {
          this.alertas = response;
          this.meta = {
            total: response.length,
            page: 1,
            limit: response.length || 5,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          };
        } else {
          this.alertas = [];
        }
        this.generatePages();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar las alertas desde el servidor';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadLotes(): void {
    this.loteService.getLotes({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.lotes = res.data;
        this.cdr.detectChanges();
      },
    });
  }

  loadGalpones(): void {
    this.galponService.getGalpones({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.galpones = res.data;
        this.cdr.detectChanges();
      },
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadAlertas();
  }

  clearFilters(): void {
    this.filtros = {
      tipo: undefined,
      prioridad: undefined,
      leida: undefined,
    };
    this.page = 1;
    this.loadAlertas();
  }

  sortByField(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortOrder = 'DESC';
    }
    this.loadAlertas();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.meta.totalPages) return;
    this.page = page;
    this.loadAlertas();
  }

  changeLimit(): void {
    this.page = 1;
    this.loadAlertas();
  }

  toggleLeida(alerta: Alerta): void {
    if (this.auth.isVisitante()) return;
    const nuevoEstado = !alerta.leida;
    this.alertaService.updateAlerta(alerta.id_alerta, { leida: nuevoEstado }).subscribe({
      next: () => {
        this.loadAlertas();
      },
      error: () => {
        this.error = 'Error al actualizar el estado de la alerta';
        this.cdr.detectChanges();
      },
    });
  }

  marcarTodasComoLeidas(): void {
    if (this.auth.isVisitante()) return;
    const unreadAlerts = this.alertas.filter((a) => !a.leida);
    if (unreadAlerts.length === 0) return;

    let completed = 0;
    this.loading = true;
    unreadAlerts.forEach((alerta) => {
      this.alertaService.markAsRead(alerta.id_alerta).subscribe({
        next: () => {
          completed++;
          if (completed === unreadAlerts.length) {
            this.loadAlertas();
          }
        },
        error: () => {
          completed++;
          if (completed === unreadAlerts.length) {
            this.loadAlertas();
          }
        },
      });
    });
  }

  eliminarAlerta(id: number): void {
    if (this.auth.isVisitante()) return;
    if (confirm('¿Está seguro de que desea eliminar este registro de alertas?')) {
      this.alertaService.deleteAlerta(id).subscribe({
        next: () => {
          this.loadAlertas();
        },
        error: () => {
          this.error = 'Error al eliminar la alerta';
          this.cdr.detectChanges();
        },
      });
    }
  }

  abrirModalCrear(): void {
    if (this.auth.isVisitante()) return;
    this.guardando = false;
    this.alertaForm = {
      titulo: '',
      mensaje: '',
      tipo: 'stock',
      prioridad: 'baja',
      lote_id: undefined,
      galpon_id: undefined,
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.guardando = false;
    this.cdr.detectChanges();
  }

  guardarAlerta(): void {
    if (this.auth.isVisitante()) return;
    if (!this.alertaForm.titulo.trim() || !this.alertaForm.mensaje.trim()) return;

    this.guardando = true;

    const payload: Partial<Alerta> = {
      titulo: this.alertaForm.titulo,
      mensaje: this.alertaForm.mensaje,
      tipo: this.alertaForm.tipo,
      prioridad: this.alertaForm.prioridad,
    };

    if (this.alertaForm.lote_id) {
      payload.lote_id = Number(this.alertaForm.lote_id);
    }
    if (this.alertaForm.galpon_id) {
      payload.galpon_id = Number(this.alertaForm.galpon_id);
    }

    this.alertaService.createAlerta(payload).subscribe({
      next: () => {
        this.page = 1;
        this.loadAlertas();
        this.cerrarModal();
      },
      error: () => {
        this.error = 'Error al registrar la alerta';
        this.guardando = false;
        this.cdr.detectChanges();
      },
    });
  }

  private generatePages(): void {
    const totalPages = this.meta.totalPages;
    const currentPage = this.meta.page;
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    this.pages = [];
    for (let i = startPage; i <= endPage; i++) {
      this.pages.push(i);
    }
  }
}