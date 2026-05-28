import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MuerteService } from '../../services/muerte';
import { LoteService } from '../../services/lote';
import { UsersService } from '../../services/users';
import { Muerte, FilterMuerteParams } from '../../interfaces/muerte.interface';
import { Lote } from '../../interfaces/lote.interface';
import { Usuario } from '../../interfaces/usuario.interface';
import { PaginationMeta, PaginationParams } from '../../interfaces/pagination.interface';

@Component({
  selector: 'app-salud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './salud.html',
  styleUrl: './salud.css',
})
export class Salud implements OnInit {
  muertes: Muerte[] = [];
  lotes: Lote[] = [];
  usuarios: Usuario[] = [];
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
  sortBy = 'fecha';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  filtros: FilterMuerteParams = {};
  pages: number[] = [];
  loading = false;
  error: string | null = null;
  Math = Math;

  // Variables para CRUD Modal
  mostrarModal = false;
  muerteEditando: Muerte | null = null;
  muerteForm: {
    fecha: string;
    cantidad: number;
    causa: string;
    loteId?: number;
    usuarioId?: string;
  } = {
    fecha: '',
    cantidad: 0,
    causa: '',
  };

  constructor(
    private muerteService: MuerteService,
    private loteService: LoteService,
    private usersService: UsersService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLotes();
    this.loadUsuarios();
    this.loadMuertes();
  }

  loadLotes(): void {
    this.loteService.getLotes({ limit: 100 }).subscribe({
      next: (response) => {
        this.lotes = response.data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar lotes';
        this.cdr.detectChanges();
      }
    });
  }

  loadUsuarios(): void {
    this.usersService.getUsers({ limit: 100 }).subscribe({
      next: (response) => {
        this.usuarios = response.data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar usuarios';
        this.cdr.detectChanges();
      }
    });
  }

  loadMuertes(): void {
    this.loading = true;
    this.error = null;

    const params: PaginationParams & Partial<FilterMuerteParams> = {
      page: this.page,
      limit: this.limit,
      sortBy: this.sortBy,
      order: this.sortOrder,
      ...this.filtros,
    };

    this.muerteService.getMuertes(params).subscribe({
      next: (response) => {
        this.muertes = response.data;
        this.meta = response.meta;
        this.generatePages();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar historial de salud';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadMuertes();
  }

  clearFilters(): void {
    this.filtros = {};
    this.page = 1;
    this.loadMuertes();
  }

  sortByField(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortOrder = 'ASC';
    }
    this.loadMuertes();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.meta.totalPages) return;
    this.page = page;
    this.loadMuertes();
  }

  changeLimit(): void {
    this.page = 1;
    this.loadMuertes();
  }

  abrirModalCrear(): void {
    this.muerteEditando = null;
    this.muerteForm = {
      fecha: new Date().toISOString().substring(0, 10),
      cantidad: 1,
      causa: '',
      loteId: this.lotes.length > 0 ? this.lotes[0].id_lote : undefined,
      usuarioId: this.usuarios.length > 0 ? this.usuarios[0].id : undefined,
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  abrirModalEditar(muerte: Muerte): void {
    this.muerteEditando = muerte;
    this.muerteForm = {
      fecha: muerte.fecha ? new Date(muerte.fecha).toISOString().substring(0, 10) : '',
      cantidad: muerte.cantidad,
      causa: muerte.causa,
      loteId: muerte.lote?.id_lote,
      usuarioId: muerte.usuario?.id,
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.cdr.detectChanges();
  }

  guardarMuerte(): void {
    if (!this.muerteForm.loteId || !this.muerteForm.usuarioId) {
      return;
    }

    const payload = {
      fecha: this.muerteForm.fecha,
      cantidad: Number(this.muerteForm.cantidad),
      causa: this.muerteForm.causa,
      loteId: Number(this.muerteForm.loteId),
      usuarioId: this.muerteForm.usuarioId,
    };

    if (this.muerteEditando) {
      this.muerteService.updateMuerte(this.muerteEditando.id_muerte, payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.loadMuertes();
        },
        error: () => {
          this.error = 'Error al actualizar registro de muerte';
          this.cdr.detectChanges();
        },
      });
    } else {
      this.muerteService.createMuerte(payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.loadMuertes();
        },
        error: () => {
          this.error = 'Error al registrar muerte';
          this.cdr.detectChanges();
        },
      });
    }
  }

  eliminarMuerte(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este registro de salud/baja?')) {
      this.muerteService.deleteMuerte(id).subscribe({
        next: () => {
          this.loadMuertes();
        },
        error: () => {
          this.error = 'Error al eliminar registro';
          this.cdr.detectChanges();
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
}