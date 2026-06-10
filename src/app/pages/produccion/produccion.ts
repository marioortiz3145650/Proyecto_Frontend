import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProduccionService } from '../../services/produccion';
import { LoteService } from '../../services/lote';
import { UsersService } from '../../services/users';
import { Produccion, FilterProduccionParams } from '../../interfaces/produccion.interface';
import { Lote } from '../../interfaces/lote.interface';
import { Usuario } from '../../interfaces/usuario.interface';
import { PaginationMeta, PaginationParams } from '../../interfaces/pagination.interface';

@Component({
  selector: 'app-produccion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './produccion.html',
  styleUrl: './produccion.css',
})
export class ProduccionPage implements OnInit {
  producciones: Produccion[] = [];
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
  limit = 5;
  sortBy = 'fecha';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  filtros: FilterProduccionParams = {};
  pages: number[] = [];
  loading = false;
  error: string | null = null;
  Math = Math;

  mostrarModal = false;
  produccionEditando: Produccion | null = null;
  produccionForm: {
    fecha: string;
    jumbo: number;
    aaa: number;
    aa: number;
    a: number;
    b: number;
    c: number;
    lote_id?: number;
    creado_por?: string;
  } = {
    fecha: '',
    jumbo: 0,
    aaa: 0,
    aa: 0,
    a: 0,
    b: 0,
    c: 0,
  };

  constructor(
    private produccionService: ProduccionService,
    private loteService: LoteService,
    private usersService: UsersService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLotes();
    this.loadUsuarios();
    this.loadProducciones();
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

  loadProducciones(): void {
    this.loading = true;
    this.error = null;

    const params: PaginationParams & Partial<FilterProduccionParams> = {
      page: this.page,
      limit: this.limit,
      sortBy: this.sortBy,
      order: this.sortOrder,
    };

    if (this.filtros.lote !== undefined && this.filtros.lote !== null) {
      params.lote = this.filtros.lote;
    }
    if (this.filtros.fecha_inicio) params.fecha_inicio = this.filtros.fecha_inicio;
    if (this.filtros.fecha_fin) params.fecha_fin = this.filtros.fecha_fin;

    this.produccionService.getProducciones(params).subscribe({
      next: (response) => {
        this.producciones = response.data;
        this.meta = response.meta;
        this.generatePages();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar producción';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadProducciones();
  }

  clearFilters(): void {
    this.filtros = {};
    this.page = 1;
    this.loadProducciones();
  }

  sortByField(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortOrder = 'ASC';
    }
    this.loadProducciones();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.meta.totalPages) return;
    this.page = page;
    this.loadProducciones();
  }

  changeLimit(): void {
    this.page = 1;
    this.loadProducciones();
  }

  abrirModalCrear(): void {
    this.produccionEditando = null;
    const adminUser = this.usuarios.find(u => u.nombre_usuario === 'admin' || u.nombre.toLowerCase().includes('admin'));
    this.produccionForm = {
      fecha: new Date().toISOString().substring(0, 10),
      jumbo: 0,
      aaa: 0,
      aa: 0,
      a: 0,
      b: 0,
      c: 0,
      lote_id: this.lotes.length > 0 ? this.lotes[0].id_lote : undefined,
      creado_por: adminUser ? adminUser.id : (this.usuarios.length > 0 ? this.usuarios[0].id : undefined),
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  abrirModalEditar(prod: Produccion): void {
    this.produccionEditando = prod;
    const rawDate = prod.fecha ? new Date(prod.fecha).toISOString().substring(0, 10) : '';

    this.produccionForm = {
      fecha: rawDate,
      jumbo: prod.jumbo || 0,
      aaa: prod.aaa || 0,
      aa: prod.aa || 0,
      a: prod.a || 0,
      b: prod.b || 0,
      c: prod.c || 0,
      lote_id: prod.lote?.id_lote,
      creado_por: prod.creado_por?.id,
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.cdr.detectChanges();
  }

  get totalFormEggs(): number {
    return (
      Number(this.produccionForm.jumbo || 0) +
      Number(this.produccionForm.aaa || 0) +
      Number(this.produccionForm.aa || 0) +
      Number(this.produccionForm.a || 0) +
      Number(this.produccionForm.b || 0) +
      Number(this.produccionForm.c || 0)
    );
  }

  guardarProduccion(): void {
    if (!this.produccionForm.lote_id || !this.produccionForm.creado_por) {
      return;
    }

    const payload = {
      fecha: this.produccionForm.fecha,
      jumbo: Number(this.produccionForm.jumbo || 0),
      aaa: Number(this.produccionForm.aaa || 0),
      aa: Number(this.produccionForm.aa || 0),
      a: Number(this.produccionForm.a || 0),
      b: Number(this.produccionForm.b || 0),
      c: Number(this.produccionForm.c || 0),
      lote_id: Number(this.produccionForm.lote_id),
      creado_por: this.produccionForm.creado_por,
    };

    if (this.produccionEditando) {
      this.produccionService.updateProduccion(this.produccionEditando.id_produccion, payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.loadProducciones();
        },
        error: (err) => {
          console.error('Error al editar producción:', err);
          const errorMsg = err.error?.message || 'Error al editar producción';
          alert(Array.isArray(errorMsg) ? errorMsg.join('\n') : errorMsg);
          this.cdr.detectChanges();
        },
      });
    } else {
      this.produccionService.createProduccion(payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.loadProducciones();
        },
        error: (err) => {
          console.error('Error al registrar producción:', err);
          const errorMsg = err.error?.message || 'Error al registrar producción';
          alert(Array.isArray(errorMsg) ? errorMsg.join('\n') : errorMsg);
          this.cdr.detectChanges();
        },
      });
    }
  }

  eliminarProduccion(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este registro de producción?')) {
      this.produccionService.deleteProduccion(id).subscribe({
        next: () => {
          this.loadProducciones();
        },
        error: (err) => {
          console.error('Error al eliminar producción:', err);
          const errorMsg = err.error?.message || 'Error al eliminar producción';
          alert(Array.isArray(errorMsg) ? errorMsg.join('\n') : errorMsg);
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