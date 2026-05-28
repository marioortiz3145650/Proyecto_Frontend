import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlimentoService } from '../../services/alimento';
import { TipoAlimentoService } from '../../services/tipo-alimento';
import { UnidadMedidaService } from '../../services/unidad-medida';
import { Alimento, TipoAlimento, UnidadMedida, FilterAlimentoParams } from '../../interfaces/alimento.interface';
import { PaginationMeta, PaginationParams } from '../../interfaces/pagination.interface';

@Component({
  selector: 'app-alimentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alimentos.html',
  styleUrl: './alimentos.css',
})
export class Alimentos implements OnInit {
  alimentos: Alimento[] = [];
  tiposAlimento: TipoAlimento[] = [];
  unidadesMedida: UnidadMedida[] = [];
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
  sortBy = 'nombre';
  sortOrder: 'ASC' | 'DESC' = 'ASC';

  filtros: FilterAlimentoParams = {};
  pages: number[] = [];
  loading = false;
  error: string | null = null;
  Math = Math;

  // Variables para CRUD Modal
  mostrarModal = false;
  alimentoEditando: Alimento | null = null;
  alimentoForm: {
    nombre: string;
    tipo_alimento_id?: number;
    unidad_medida_id?: number;
    stock_actual: number;
    stock_minimo: number;
    precio_unitario: number;
  } = {
    nombre: '',
    stock_actual: 0,
    stock_minimo: 0,
    precio_unitario: 0,
  };

  constructor(
    private alimentoService: AlimentoService,
    private tipoAlimentoService: TipoAlimentoService,
    private unidadMedidaService: UnidadMedidaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTiposAlimento();
    this.loadUnidadesMedida();
    this.loadAlimentos();
  }

  loadTiposAlimento(): void {
    this.tipoAlimentoService.getTiposAlimento().subscribe({
      next: (data) => {
        this.tiposAlimento = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar tipos de alimento';
        this.cdr.detectChanges();
      }
    });
  }

  loadUnidadesMedida(): void {
    this.unidadMedidaService.getUnidadesMedida().subscribe({
      next: (data) => {
        this.unidadesMedida = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar unidades de medida';
        this.cdr.detectChanges();
      }
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
      ...this.filtros,
    };

    this.alimentoService.getAlimentos(params).subscribe({
      next: (response) => {
        this.alimentos = response.data;
        this.meta = response.meta;
        this.generatePages();
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

  applyFilters(): void {
    this.page = 1;
    this.loadAlimentos();
  }

  clearFilters(): void {
    this.filtros = {};
    this.page = 1;
    this.loadAlimentos();
  }

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

  changeLimit(): void {
    this.page = 1;
    this.loadAlimentos();
  }

  abrirModalCrear(): void {
    this.alimentoEditando = null;
    this.alimentoForm = {
      nombre: '',
      tipo_alimento_id: this.tiposAlimento.length > 0 ? this.tiposAlimento[0].id_tipo_insumo : undefined,
      unidad_medida_id: this.unidadesMedida.length > 0 ? this.unidadesMedida[0].id_unidad : undefined,
      stock_actual: 0,
      stock_minimo: 0,
      precio_unitario: 0,
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  abrirModalEditar(alimento: Alimento): void {
    this.alimentoEditando = alimento;
    this.alimentoForm = {
      nombre: alimento.nombre,
      tipo_alimento_id: alimento.tipo_alimento?.id_tipo_insumo,
      unidad_medida_id: alimento.unidad_medida?.id_unidad,
      stock_actual: Number(alimento.stock_actual),
      stock_minimo: Number(alimento.stock_minimo),
      precio_unitario: Number(alimento.precio_unitario),
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.cdr.detectChanges();
  }

  guardarAlimento(): void {
    if (!this.alimentoForm.tipo_alimento_id || !this.alimentoForm.unidad_medida_id) {
      return;
    }

    const payload = {
      nombre: this.alimentoForm.nombre,
      tipo_alimento_id: Number(this.alimentoForm.tipo_alimento_id),
      unidad_medida_id: Number(this.alimentoForm.unidad_medida_id),
      stock_actual: Number(this.alimentoForm.stock_actual),
      stock_minimo: Number(this.alimentoForm.stock_minimo),
      precio_unitario: Number(this.alimentoForm.precio_unitario),
    };

    if (this.alimentoEditando) {
      this.alimentoService.updateAlimento(this.alimentoEditando.id_insumo, payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.loadAlimentos();
        },
        error: () => {
          this.error = 'Error al actualizar alimento';
          this.cdr.detectChanges();
        },
      });
    } else {
      this.alimentoService.createAlimento(payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.loadAlimentos();
        },
        error: () => {
          this.error = 'Error al registrar alimento';
          this.cdr.detectChanges();
        },
      });
    }
  }

  eliminarAlimento(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este alimento/insumo?')) {
      this.alimentoService.deleteAlimento(id).subscribe({
        next: () => {
          this.loadAlimentos();
        },
        error: () => {
          this.error = 'Error al eliminar alimento';
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