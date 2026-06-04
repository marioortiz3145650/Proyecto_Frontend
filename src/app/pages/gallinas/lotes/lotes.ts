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
  limit = 5;
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
    fecha_inicio: string;
    fecha_fin?: string | null;
    total_gallinas: number;
  } = {
    edad_semanas: 0,
    fecha_inicio: '',
    total_gallinas: 0,
  };

  constructor(
    private loteService: LoteService,
    private razaService: RazaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRazas();
    setTimeout(() => {
      this.loadLotes();
    }, 0);
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
      fecha_inicio: new Date().toISOString().substring(0, 10),
      fecha_fin: null,
      total_gallinas: 0
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  abrirModalEditar(lote: Lote): void {
    this.loteEditando = lote;
    this.loteForm = {
      raza_id: lote.raza?.id_raza,
      edad_semanas: lote.edad_semanas,
      fecha_inicio: lote.fecha_inicio ? new Date(lote.fecha_inicio).toISOString().substring(0, 10) : '',
      fecha_fin: lote.fecha_fin ? new Date(lote.fecha_fin).toISOString().substring(0, 10) : null,
      total_gallinas: lote.total_gallinas || 0
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.cdr.detectChanges();
  }

  guardarLote(): void {
    const payload: any = {
      edad_semanas: Number(this.loteForm.edad_semanas),
      fecha_inicio: this.loteForm.fecha_inicio,
      fecha_fin: this.loteForm.fecha_fin ? this.loteForm.fecha_fin : null,
      raza: this.loteForm.raza_id ? Number(this.loteForm.raza_id) : undefined,
      raza_id: this.loteForm.raza_id ? Number(this.loteForm.raza_id) : undefined,
      total_gallinas: Number(this.loteForm.total_gallinas)
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
        error: (err) => {
          console.error('Error al eliminar lote:', err);
          const errorMsg = err.error?.message || 'No se pudo eliminar el lote.';
          alert(Array.isArray(errorMsg) ? errorMsg.join('\n') : errorMsg);
        },
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

  calcularEdadActual(lote: Lote): number {
    if (!lote.fecha_inicio) return lote.edad_semanas;
    const inicio = new Date(lote.fecha_inicio);
    const hoy = new Date();
    const diffTime = Math.max(0, hoy.getTime() - inicio.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    return lote.edad_semanas + diffWeeks;
  }
  toggleLote(lote: Lote): void {
  this.loteService.toggleActivo(lote.id_lote).subscribe({
    next: (actualizado) => {
      lote.fecha_fin = actualizado.fecha_fin;
      this.cdr.detectChanges();
    },
    error: (err) => console.error('Error al cambiar estado del lote:', err),
  });
}

  // Mini modal raza
mostrarModalRaza = false;
nuevaRazaNombre = '';
errorRaza: string | null = null;

abrirModalRaza(): void {
  this.nuevaRazaNombre = '';
  this.errorRaza = null;
  this.mostrarModalRaza = true;
  this.cdr.detectChanges();
}

cerrarModalRaza(): void {
  this.mostrarModalRaza = false;
  this.cdr.detectChanges();
}

guardarRazaRapida(): void {
  this.errorRaza = null;
  this.razaService.createRaza({ nombre_raza: this.nuevaRazaNombre, activo: true }).subscribe({
    next: (nuevaRaza) => {
      this.razas.push(nuevaRaza);
      this.loteForm.raza_id = nuevaRaza.id_raza;
      this.cerrarModalRaza();
      this.cdr.detectChanges();
    },
    error: (err) => {
      if (err.status === 409) {
        // Ya existe, buscar y reactivar
        const existente = this.razas.find(
          r => r.nombre_raza.toLowerCase() === this.nuevaRazaNombre.toLowerCase()
        );
        if (existente) {
          this.razaService.restoreRaza(existente.id_raza).subscribe({
            next: () => {
              existente.activo = true;
              this.loteForm.raza_id = existente.id_raza;
              this.cerrarModalRaza();
              this.cdr.detectChanges();
            },
            error: () => {
              this.errorRaza = 'No se pudo reactivar la raza';
              this.cdr.detectChanges();
            }
          });
        } else {
          this.errorRaza = 'La raza ya existe pero está inactiva. Reactívala desde el módulo de Razas.';
          this.cdr.detectChanges();
        }
      } else {
        this.errorRaza = err.error?.message || 'Error al crear la raza';
        this.cdr.detectChanges();
      }
    },
  });
}
}