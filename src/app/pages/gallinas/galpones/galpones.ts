import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GalponService } from '../../../services/galpon.service';
import { LoteService } from '../../../services/lote';
import { Galpon, FilterGalponParams } from '../../../interfaces/galpon.interface';
import { Lote } from '../../../interfaces/lote.interface';
import { PaginatedResponse, PaginationMeta, PaginationParams } from '../../../interfaces/pagination.interface';
import { AuthService } from '../../../services/auth.service';
import { AlertaService } from '../../../services/alerta';
import { ToastService } from '../../../services/toast.service';
import { DialogService } from '../../../services/dialog.service';
import { PaginationComponent } from '../../../components/pagination/pagination.component';

@Component({
  selector: 'app-galpones',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './galpones.html',
  styleUrl: './galpones.css',
})
export class Galpones implements OnInit {
  galpones: Galpon[] = [];
  lotes: Lote[] = [];
  auth = inject(AuthService);
  private alertaService = inject(AlertaService);
  meta: PaginationMeta = {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };

  page = 1;
  limit = 5;
  sortBy = 'nombre';
  sortOrder: 'ASC' | 'DESC' = 'ASC';

  filtros: FilterGalponParams = {};
  searchQuery = '';
  loading = false;
  error: string | null = null;
  Math = Math;

  get galponesVisibles(): Galpon[] {
    if (!this.searchQuery.trim()) return this.galpones;
    const q = this.searchQuery.toLowerCase().trim();
    return this.galpones.filter(g =>
      (g.nombre && g.nombre.toLowerCase().includes(q)) ||
      (g.direccion && g.direccion.toLowerCase().includes(q)) ||
      (g.lote?.id_lote && String(g.lote.id_lote).includes(q))
    );
  }

  // Variables para CRUD Modal
  mostrarModal = false;
  galponEditando: Galpon | null = null;
  galponForm: {
    nombre: string;
    direccion: string;
    lote_id?: string | null;
  } = {
    nombre: '',
    direccion: '',
    lote_id: null
  };

  constructor(
    private galponService: GalponService,
    private loteService: LoteService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private dialog: DialogService
  ) {}

  ngOnInit(): void {
    this.cargarLotes();
    this.cargarGalpones();
  }

  cargarLotes(): void {
    this.loteService.getLotes({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.lotes = res.data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar lotes:', err),
    });
  }

  cargarGalpones(): void {
    this.loading = true;
    this.error = null;

    const params: PaginationParams & Partial<FilterGalponParams> = {
      page: this.page,
      limit: this.limit,
      sortBy: this.sortBy,
      order: this.sortOrder,
      ...this.filtros,
    };

    this.galponService.getGalpones(params).subscribe({
      next: (response: PaginatedResponse<Galpon>) => {
        this.galpones = response.data;
        this.meta = response.meta;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar galpones:', err);
        this.error = 'Error al cargar galpones';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  aplicarFiltros(): void {
    this.page = 1;
    this.cargarGalpones();
  }

  limpiarFiltros(): void {
    this.filtros = {};
    this.page = 1;
    this.cargarGalpones();
  }

  ordenarPor(campo: string): void {
    if (this.sortBy === campo) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = campo;
      this.sortOrder = 'ASC';
    }
    this.cargarGalpones();
  }

  cambiarPagina(page: number): void {
    if (page < 1 || page > this.meta.totalPages) return;
    this.page = page;
    this.cargarGalpones();
  }

  cambiarLimite(newLimit?: number): void {
    if (newLimit !== undefined) this.limit = newLimit;
    this.page = 1;
    this.cargarGalpones();
  }

  // Métodos CRUD
  abrirModalCrear(): void {
    if (this.auth.isVisitante()) return;
    this.galponEditando = null;
    this.galponForm = {
      nombre: '',
      direccion: '',
      lote_id: this.lotes.length > 0 ? (this.lotes[0].uuid || null) : null
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  abrirModalEditar(galpon: Galpon): void {
    if (!this.auth.isAdmin()) return;
    this.galponEditando = galpon;
    this.galponForm = {
      nombre: galpon.nombre,
      direccion: galpon.direccion,
      lote_id: galpon.lote?.uuid || null
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.cdr.detectChanges();
  }

  guardarGalpon(): void {
    if (this.auth.isVisitante()) return;
    const payload: any = {
      nombre: this.galponForm.nombre,
      direccion: this.galponForm.direccion,
      lote: this.galponForm.lote_id || null
    };

    if (this.galponEditando && this.galponEditando.uuid !== undefined) {
      this.galponService.updateGalpon(this.galponEditando.uuid, payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarGalpones();
          this.alertaService.evaluarYGenerarAlertas().subscribe();
          this.toast.success('Galpón actualizado correctamente.');
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error al editar galpón', 'Error');
          this.cdr.detectChanges();
        },
      });
    } else {
      this.galponService.createGalpon(payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarGalpones();
          this.alertaService.evaluarYGenerarAlertas().subscribe();
          this.toast.success('Galpón creado correctamente.');
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error al crear galpón', 'Error');
          this.cdr.detectChanges();
        },
      });
    }
  }

  eliminarGalpon(uuid: string | undefined): void {
    if (!this.auth.isAdmin()) return;
    if (uuid === undefined) return;
    this.dialog.confirmDelete(
      'Esta acción puede afectar a otros procesos o registros vinculados.',
      '¿Eliminar este galpón?',
      'galpón'
    ).subscribe((confirmado) => {
      if (!confirmado) return;
      this.galponService.deleteGalpon(uuid).subscribe({
        next: () => {
          this.cargarGalpones();
          this.alertaService.evaluarYGenerarAlertas().subscribe();
          this.toast.success('Galpón eliminado.', 'Eliminado');
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error al eliminar galpón', 'Error');
          this.cdr.detectChanges();
        },
      });
    });
  }
}