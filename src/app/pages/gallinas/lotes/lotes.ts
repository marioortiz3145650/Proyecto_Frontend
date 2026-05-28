import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoteService } from '../../../services/lote';
import { RazaService } from '../../../services/raza';
import { Lote, FilterLoteParams } from '../../../interfaces/lote.interface';
import { Raza } from '../../../interfaces/raza.interface';
import { PaginationMeta, PaginationParams } from '../../../interfaces/pagination.interface';

@Component({
  selector: 'app-lotes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lotes.html',
  styleUrl: './lotes.css',
})
export class Lotes implements OnInit {
  lotes: Lote[] = [];
  razas: Raza[] = [];
  meta: PaginationMeta = {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };

  page = 1;
  limit = 10;
  sortBy = 'fecha_creacion';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  filtros: FilterLoteParams = {};
  pages: number[] = [];
  loading = false;
  error: string | null = null;
  Math = Math;

  // Variables para CRUD Modal
  mostrarModal = false;
  loteEditando: Lote | null = null;
  loteForm: {
    raza_id?: number;
    edad_semanas: number;
    produccion_pct: number;
    fecha_inicio: string;
    fecha_fin?: string | null;
  } = {
    edad_semanas: 0,
    produccion_pct: 0,
    fecha_inicio: '',
  };

  constructor(
    private loteService: LoteService,
    private razaService: RazaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRazas();
    this.loadLotes();
  }

  loadRazas(): void {
    this.razaService.getRazas().subscribe({
      next: (data) => {
        this.razas = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar razas:', err),
    });
  }

  loadLotes(): void {
    this.loading = true;
    this.error = null;

    const params: PaginationParams & Partial<FilterLoteParams> = {
      page: this.page,
      limit: this.limit,
      sortBy: this.sortBy,
      order: this.sortOrder,
      ...this.filtros,
    };

    this.loteService.getLotes(params).subscribe({
      next: (response) => {
        this.lotes = response.data;
        this.meta = response.meta;
        this.generatePages();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar lotes:', err);
        this.error = 'Error al cargar lotes';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadLotes();
  }

  clearFilters(): void {
    this.filtros = {};
    this.page = 1;
    this.loadLotes();
  }

  sortByField(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortOrder = 'ASC';
    }
    this.loadLotes();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.meta.totalPages) return;
    this.page = page;
    this.loadLotes();
  }

  changeLimit(): void {
    this.page = 1;
    this.loadLotes();
  }

  // Métodos CRUD
  abrirModalCrear(): void {
    this.loteEditando = null;
    this.loteForm = {
      raza_id: this.razas.length > 0 ? this.razas[0].id_raza : undefined,
      edad_semanas: 1,
      produccion_pct: 0,
      fecha_inicio: new Date().toISOString().substring(0, 10),
      fecha_fin: null
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  abrirModalEditar(lote: Lote): void {
    this.loteEditando = lote;
    this.loteForm = {
      raza_id: lote.raza?.id_raza,
      edad_semanas: lote.edad_semanas,
      produccion_pct: lote.produccion_pct,
      fecha_inicio: lote.fecha_inicio ? new Date(lote.fecha_inicio).toISOString().substring(0, 10) : '',
      fecha_fin: lote.fecha_fin ? new Date(lote.fecha_fin).toISOString().substring(0, 10) : null
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.cdr.detectChanges();
  }

  guardarLote(): void {
    const payload: Partial<Lote> & { raza_id?: number } = {
      edad_semanas: Number(this.loteForm.edad_semanas),
      produccion_pct: Number(this.loteForm.produccion_pct),
      fecha_inicio: new Date(this.loteForm.fecha_inicio),
      fecha_fin: this.loteForm.fecha_fin ? new Date(this.loteForm.fecha_fin) : null,
      raza_id: this.loteForm.raza_id
    };

    if (this.loteEditando) {
      this.loteService.updateLote(this.loteEditando.id_lote, payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.loadLotes();
        },
        error: (err) => console.error('Error al editar lote:', err),
      });
    } else {
      this.loteService.createLote(payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.loadLotes();
        },
        error: (err) => console.error('Error al crear lote:', err),
      });
    }
  }

  eliminarLote(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este lote?')) {
      this.loteService.deleteLote(id).subscribe({
        next: () => {
          this.loadLotes();
        },
        error: (err) => console.error('Error al eliminar lote:', err),
      });
    }
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