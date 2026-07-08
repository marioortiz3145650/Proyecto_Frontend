import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovimientoInsumoService } from '../../../services/movimiento-insumo';
import { AlimentoService } from '../../../services/alimento';
import { LoteService } from '../../../services/lote';
import { UsersService } from '../../../services/users';
import { Alimento } from '../../../interfaces/alimento.interface';
import { Lote } from '../../../interfaces/lote.interface';
import { Usuario } from '../../../interfaces/usuario.interface';
import { AuthService } from '../../../services/auth.service';
import { AlertaService } from '../../../services/alerta';
import { ToastService } from '../../../services/toast.service';
import { DialogService } from '../../../services/dialog.service';
import { PaginationComponent } from '../../../components/pagination/pagination.component';

@Component({
  selector: 'app-consumo',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './consumo.html',
  styleUrl: './consumo.css',
})
export class Consumo implements OnInit {
  movimientos: any[] = [];
  alimentos: Alimento[] = [];
  lotes: Lote[] = [];
  usuarios: Usuario[] = [];
  auth = inject(AuthService);
  private alertaService = inject(AlertaService);

  usuariosAutorizados: Usuario[] = [];

  loading = false;
  guardando = false;
  error: string | null = null;

  mostrarModal = false;
  movimientoForm: {
    fecha: string;
    cantidad: number;
    tipo_movimiento: string;
    observaciones: string;
    insumo_id?: string;
    lote_id?: string;
    creado_por?: string;
  } = {
      fecha: '',
      cantidad: 0,
      tipo_movimiento: 'CONSUMO',
      observaciones: '',
    };

  // Filtros locales
  filtroLoteId?: string;
  filtroInsumoId?: string;

  // Paginación
  page = 1;
  limit = 5;

  get totalPages(): number {
    return Math.ceil(this.movimientosFiltrados.length / this.limit);
  }

  get movimientosPaginados(): any[] {
    const start = (this.page - 1) * this.limit;
    const end = start + this.limit;
    return this.movimientosFiltrados.slice(start, end);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.cdr.detectChanges();
  }

  onLimitChange(newLimit: number): void {
    this.limit = newLimit;
    this.page = 1;
    this.cdr.detectChanges();
  }

  constructor(
    private movimientoService: MovimientoInsumoService,
    private alimentoService: AlimentoService,
    private loteService: LoteService,
    private usersService: UsersService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private dialog: DialogService
  ) { }

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

  getRolNombre(rol: any): string {
    if (!rol) return '';
    return typeof rol === 'object' && rol.nombre ? rol.nombre : rol;
  }

  getRolConMayuscula(rol: any): string {
    const nombre = this.getRolNombre(rol);
    if (!nombre) return '';
    return nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();
  }

  loadUsuarios(): void {
    this.usersService.getActiveUsers().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.usuariosAutorizados = this.usuarios.filter(u => {
          const rolNombre = this.getRolNombre(u.rol);
          return rolNombre === 'Administrador' || rolNombre === 'Aprendiz';
        });
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

        // Ajuste defensivo de paginación
        const maxPage = this.totalPages;
        if (this.page > maxPage) {
          this.page = Math.max(1, maxPage);
        }

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
      const matchLote = !this.filtroLoteId || m.lote?.uuid === this.filtroLoteId;
      const matchInsumo = !this.filtroInsumoId || m.alimento?.uuid === this.filtroInsumoId;
      return matchLote && matchInsumo;
    });
  }

  get alimentosConStock(): Alimento[] {
    return this.alimentos.filter(a => Number(a.stock_actual) > 0);
  }

  clearFilters(): void {
    this.filtroLoteId = undefined;
    this.filtroInsumoId = undefined;
    this.page = 1;
    this.cdr.detectChanges();
  }

  abrirModalCrear(): void {
    if (this.auth.isVisitante()) return;
    this.movimientoForm = {
      fecha: new Date().toISOString().substring(0, 10),
      cantidad: 0,
      tipo_movimiento: 'CONSUMO',
      observaciones: '',
      insumo_id: this.alimentos.length > 0 ? this.alimentos[0].uuid : undefined,
      lote_id: this.lotes.length > 0 ? this.lotes[0].uuid : undefined,
    };
    const activeUser = this.auth.getUser();
    const defaultCreator = this.usuariosAutorizados.find(u => String(u.uuid) === String(activeUser?.id)) || this.usuariosAutorizados[0];
    this.movimientoForm.creado_por = defaultCreator?.uuid;
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  get activeUserNombre(): string {
    const user = this.auth.getUser();
    return user?.nombre || user?.username || 'Desconocido';
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.cdr.detectChanges();
  }

  guardarMovimiento(): void {
    if (this.auth.isVisitante()) return;
    if (this.guardando) return;
    if (!this.movimientoForm.insumo_id || !this.movimientoForm.lote_id) return;

    const alimento = this.alimentos.find(a => a.uuid === this.movimientoForm.insumo_id);
    const cantidad = Number(this.movimientoForm.cantidad);

    if (alimento && cantidad > Number(alimento.stock_actual)) {
      this.toast.warning(`Stock insuficiente para el alimento "${alimento.nombre}". Stock actual: ${alimento.stock_actual}, solicitado: ${cantidad}`, 'Stock insuficiente');
      return;
    }

    this.guardando = true;
    const payload: any = {
      fecha: this.movimientoForm.fecha,
      cantidad,
      tipo_movimiento: this.movimientoForm.tipo_movimiento,
      observaciones: this.movimientoForm.observaciones,
      insumo_id: this.movimientoForm.insumo_id,
      lote_id: this.movimientoForm.lote_id,
    };
    const activeUser = this.auth.getUser();
    payload.creado_por = activeUser?.id ? String(activeUser.id) : this.movimientoForm.creado_por;

    this.movimientoService.createMovimiento(payload).subscribe({
      next: () => {
        this.guardando = false;
        this.error = null;
        this.cerrarModal();
        this.loadMovimientos();
        this.alertaService.evaluarYGenerarAlertas().subscribe();
        this.toast.success('Consumo registrado correctamente.');
      },
      error: (err) => {
        const msg = err.error?.message || 'Error al registrar consumo de alimento';
        this.toast.error(msg, 'Error');
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  eliminarMovimiento(uuid: string): void {
    if (this.auth.isVisitante()) return;
    this.dialog.confirmDelete(
      'Esta acción puede afectar a otros procesos o registros vinculados.',
      '¿Eliminar este registro de consumo?',
      'registro de consumo'
    ).subscribe((confirmado) => {
      if (!confirmado) return;
      this.movimientoService.deleteMovimiento(uuid).subscribe({
        next: () => {
          this.loadMovimientos();
          this.alertaService.evaluarYGenerarAlertas().subscribe();
          this.toast.success('Consumo eliminado correctamente.', 'Eliminado');
        },
        error: () => {
          this.error = 'Error al eliminar consumo';
          this.cdr.detectChanges();
        }
      });
    });
  }

  getUsuarioDisplayName(user: any): string {
    if (!user) return 'N/A';
    const nombre = user.nombre || user.nombre_usuario || '';
    if (nombre.toLowerCase() === 'admin') {
      return 'Administrador Sistema';
    }
    return nombre;
  }
}
