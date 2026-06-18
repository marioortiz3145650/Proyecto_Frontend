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

@Component({
  selector: 'app-galpones',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  pages: number[] = [];
  loading = false;
  error: string | null = null;
  Math = Math;

  // Variables para CRUD Modal
  mostrarModal = false;
  galponEditando: Galpon | null = null;
  galponForm: {
    nombre: string;
    direccion: string;
    lote_id?: number | null;
  } = {
    nombre: '',
    direccion: '',
    lote_id: null
  };

  constructor(
    private galponService: GalponService,
    private loteService: LoteService,
    private cdr: ChangeDetectorRef
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
        this.generarPaginas();
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

  cambiarLimite(): void {
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
      lote_id: this.lotes.length > 0 ? this.lotes[0].id_lote : null
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  abrirModalEditar(galpon: Galpon): void {
    if (this.auth.isVisitante()) return;
    this.galponEditando = galpon;
    this.galponForm = {
      nombre: galpon.nombre,
      direccion: galpon.direccion,
      lote_id: galpon.lote?.id_lote || null
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
      lote: this.galponForm.lote_id ? Number(this.galponForm.lote_id) : null
    };

    if (this.galponEditando && this.galponEditando.id_galpon !== undefined) {
      this.galponService.updateGalpon(this.galponEditando.id_galpon, payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarGalpones();
          this.alertaService.evaluarYGenerarAlertas().subscribe();
        },
        error: (err) => console.error('Error al editar galpón:', err),
      });
    } else {
      this.galponService.createGalpon(payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarGalpones();
          this.alertaService.evaluarYGenerarAlertas().subscribe();
        },
        error: (err) => console.error('Error al crear galpón:', err),
      });
    }
  }

  eliminarGalpon(id: number | undefined): void {
    if (this.auth.isVisitante()) return;
    if (id === undefined) return;
    if (confirm('¿Está seguro de que desea eliminar este galpón?')) {
      this.galponService.deleteGalpon(id).subscribe({
        next: () => {
          this.cargarGalpones();
          this.alertaService.evaluarYGenerarAlertas().subscribe();
        },
        error: (err) => console.error('Error al eliminar galpón:', err),
      });
    }
  }

  generarPaginas(): void {
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