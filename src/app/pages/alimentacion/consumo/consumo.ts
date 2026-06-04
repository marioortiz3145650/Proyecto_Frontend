import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovimientoInsumoService } from '../../../services/movimiento-insumo';
import { AlimentoService } from '../../../services/alimento';
import { LoteService } from '../../../services/lote';
import { UsersService } from '../../../services/users';
import { Alimento } from '../../../interfaces/alimento.interface';
import { Lote } from '../../../interfaces/lote.interface';
import { Usuario } from '../../../interfaces/usuario.interface';

@Component({
  selector: 'app-consumo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consumo.html',
  styleUrl: './consumo.css',
})
export class Consumo implements OnInit {
  movimientos: any[] = [];
  alimentos: Alimento[] = [];
  lotes: Lote[] = [];
  usuarios: Usuario[] = [];

  loading = false;
  guardando = false;
  error: string | null = null;

  mostrarModal = false;
  movimientoForm: {
    fecha: string;
    cantidad: number;
    tipo_movimiento: string;
    observaciones: string;
    insumo_id?: number;
    lote_id?: number;
    creado_por?: string;
  } = {
    fecha: '',
    cantidad: 0,
    tipo_movimiento: 'CONSUMO',
    observaciones: '',
  };

  // Filtros locales
  filtroLoteId?: number;
  filtroInsumoId?: number;

  constructor(
    private movimientoService: MovimientoInsumoService,
    private alimentoService: AlimentoService,
    private loteService: LoteService,
    private usersService: UsersService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAlimentos();
    this.loadLotes();
    this.loadUsuarios();
    this.loadMovimientos();
  }

  loadAlimentos(): void {
    this.alimentoService.getAlimentos({ limit: 100 }).subscribe({
      next: (response) => {
        this.alimentos = response.data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar alimentos';
        this.cdr.detectChanges();
      }
    });
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

  loadMovimientos(): void {
    this.loading = true;
    this.error = null;
    this.movimientoService.getMovimientos().subscribe({
      next: (data) => {
        this.movimientos = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar movimientos de consumo';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get movimientosFiltrados(): any[] {
    return this.movimientos.filter(m => {
      const matchLote = !this.filtroLoteId || m.lote?.id_lote === Number(this.filtroLoteId);
      const matchInsumo = !this.filtroInsumoId || m.alimento?.id_insumo === Number(this.filtroInsumoId);
      return matchLote && matchInsumo;
    });
  }

  clearFilters(): void {
    this.filtroLoteId = undefined;
    this.filtroInsumoId = undefined;
  }

  abrirModalCrear(): void {
    const adminUser = this.usuarios.find(u => u.nombre_usuario === 'admin' || u.nombre.toLowerCase().includes('admin'));
    this.movimientoForm = {
      fecha: new Date().toISOString().substring(0, 10),
      cantidad: 0,
      tipo_movimiento: 'CONSUMO',
      observaciones: '',
      insumo_id: this.alimentos.length > 0 ? this.alimentos[0].id_insumo : undefined,
      lote_id: this.lotes.length > 0 ? this.lotes[0].id_lote : undefined,
      creado_por: adminUser ? adminUser.id : (this.usuarios.length > 0 ? this.usuarios[0].id : undefined),
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.cdr.detectChanges();
  }

  guardarMovimiento(): void {
    if (this.guardando) return;
    if (!this.movimientoForm.insumo_id || !this.movimientoForm.lote_id || !this.movimientoForm.creado_por) {
      return;
    }

    this.guardando = true;
    const payload = {
      fecha: this.movimientoForm.fecha,
      cantidad: Number(this.movimientoForm.cantidad),
      tipo_movimiento: this.movimientoForm.tipo_movimiento,
      observaciones: this.movimientoForm.observaciones,
      insumo_id: Number(this.movimientoForm.insumo_id),
      lote_id: Number(this.movimientoForm.lote_id),
      creado_por: this.movimientoForm.creado_por,
    };

    this.movimientoService.createMovimiento(payload).subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModal();
        this.loadMovimientos();
      },
      error: (err) => {
        this.error = 'Error al registrar consumo de alimento';
        const errorMsg = err.error?.message || 'Error al registrar consumo de alimento';
        alert(Array.isArray(errorMsg) ? errorMsg.join('\n') : errorMsg);
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  eliminarMovimiento(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este registro de consumo?')) {
      this.movimientoService.deleteMovimiento(id).subscribe({
        next: () => {
          this.loadMovimientos();
        },
        error: () => {
          this.error = 'Error al eliminar consumo';
          this.cdr.detectChanges();
        }
      });
    }
  }
}
