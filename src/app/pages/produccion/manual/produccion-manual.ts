import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProduccionService } from '../../../services/produccion';
import { LoteService } from '../../../services/lote';
import { UsersService } from '../../../services/users';
import { Produccion, FilterProduccionParams } from '../../../interfaces/produccion.interface';
import { Lote } from '../../../interfaces/lote.interface';
import { Usuario } from '../../../interfaces/usuario.interface';
import { PaginationMeta, PaginationParams } from '../../../interfaces/pagination.interface';
import { AuthService } from '../../../services/auth.service';
import { AlertaService } from '../../../services/alerta';
import { ToastService } from '../../../services/toast.service';
import { DialogService } from '../../../services/dialog.service';
import { PaginationComponent } from '../../../components/pagination/pagination.component';

@Component({
  selector: 'app-produccion-manual',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './produccion-manual.html',
  styleUrl: './produccion-manual.css',
})
export class ProduccionManualComponent implements OnInit {
  producciones: Produccion[] = [];
  lotes: Lote[] = [];
  usuarios: Usuario[] = [];
  auth = inject(AuthService);
  private alertaService = inject(AlertaService);
  private toast = inject(ToastService);
  private dialog = inject(DialogService);

  usuariosAutorizados: Usuario[] = [];
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
  searchQuery = '';
  loading = false;
  error: string | null = null;
  Math = Math;

  get produccionesVisibles(): Produccion[] {
    if (!this.searchQuery.trim()) return this.producciones;
    const q = this.searchQuery.toLowerCase().trim();
    return this.producciones.filter(p =>
      String(p.id_produccion).includes(q) ||
      (p.lote?.id_lote && String(p.lote.id_lote).includes(q)) ||
      String(p.total).includes(q) ||
      this.getUsuarioDisplayName(p.creado_por).toLowerCase().includes(q)
    );
  }

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
    lote_id?: string;
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

  getRolNombre(rol: any): string {
    if (!rol) return '';
    return typeof rol === 'object' && rol.nombre ? rol.nombre : rol;
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

  loadProducciones(): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

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
    this.searchQuery = '';
    this.page = 1;
    this.loadProducciones();
  }

  sortByField(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortOrder = 'DESC';
    }
    this.loadProducciones();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.meta.totalPages) return;
    this.page = page;
    this.loadProducciones();
  }

  changeLimit(newLimit?: number): void {
    if (newLimit !== undefined) this.limit = newLimit;
    this.page = 1;
    this.loadProducciones();
  }

  abrirModalCrear(): void {
    if (this.auth.isVisitante()) return;
    this.produccionEditando = null;

    const activeUser = this.auth.getUser();
    const defaultCreator = this.usuariosAutorizados.find(u => String(u.uuid) === String(activeUser?.id)) || this.usuariosAutorizados[0];

    this.produccionForm = {
      fecha: new Date().toISOString().substring(0, 10),
      jumbo: 0,
      aaa: 0,
      aa: 0,
      a: 0,
      b: 0,
      c: 0,
      lote_id: this.lotes.length > 0 ? this.lotes[0].uuid : undefined,
      creado_por: defaultCreator?.uuid,
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  abrirModalEditar(prod: Produccion): void {
    if (this.auth.isVisitante()) return;
    this.produccionEditando = prod;
    const rawDate = prod.fecha ? new Date(prod.fecha).toISOString().substring(0, 10) : '';

    const activeUser = this.auth.getUser();
    const creadorId = prod.creado_por?.uuid || (activeUser?.id ? String(activeUser.id) : undefined);
    const loteId = prod.lote?.uuid || (this.lotes.length > 0 ? this.lotes[0].uuid : undefined);

    this.produccionForm = {
      fecha: rawDate,
      jumbo: prod.jumbo || 0,
      aaa: prod.aaa || 0,
      aa: prod.aa || 0,
      a: prod.a || 0,
      b: prod.b || 0,
      c: prod.c || 0,
      lote_id: loteId,
      creado_por: creadorId,
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.cdr.detectChanges();
  }

  get activeUserNombre(): string {
    const user = this.auth.getUser();
    return user?.nombre || user?.username || 'Desconocido';
  }

  getUsuarioDisplayName(user: any): string {
    if (!user) return 'Desconocido';
    const nombre = user.nombre || user.nombre_usuario || '';
    if (nombre.toLowerCase() === 'admin') {
      return 'Administrador Sistema';
    }
    return nombre;
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
    console.log('guardarProduccion called. form state:', this.produccionForm);
    if (this.auth.isVisitante()) {
      console.warn('Usuario es Visitante. No se permite guardar.');
      return;
    }
    if (!this.produccionForm.lote_id) {
      console.warn('Falta lote_id en el formulario de producción:', this.produccionForm);
      return;
    }

    const activeUser = this.auth.getUser();
    const defaultCreator = this.usuariosAutorizados.find(u => String(u.uuid) === String(activeUser?.id)) || this.usuariosAutorizados[0];

    const payload: any = {
      fecha: this.produccionForm.fecha,
      jumbo: Number(this.produccionForm.jumbo || 0),
      aaa: Number(this.produccionForm.aaa || 0),
      aa: Number(this.produccionForm.aa || 0),
      a: Number(this.produccionForm.a || 0),
      b: Number(this.produccionForm.b || 0),
      c: Number(this.produccionForm.c || 0),
      lote_id: this.produccionForm.lote_id,
    };

    if (!this.produccionEditando) {
      payload.creado_por = defaultCreator?.uuid;
    }

    if (this.produccionEditando) {
      this.produccionService.updateProduccion(this.produccionEditando.uuid!, payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.loadProducciones();
          this.alertaService.evaluarYGenerarAlertas().subscribe();
          this.toast.success('Producción editada correctamente.');
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error al editar producción', 'Error');
          this.cdr.detectChanges();
        },
      });
    } else {
      this.produccionService.createProduccion(payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.loadProducciones();
          this.alertaService.evaluarYGenerarAlertas().subscribe();
          this.toast.success('Producción registrada correctamente.');
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error al registrar producción', 'Error');
          this.cdr.detectChanges();
        },
      });
    }
  }

  eliminarProduccion(uuid: string): void {
    if (this.auth.isVisitante()) return;
    this.dialog.confirmDelete(
      'Esta acción puede afectar a otros procesos o registros vinculados.',
      '¿Eliminar este registro de producción?',
      'registro de producción'
    ).subscribe((confirmado) => {
      if (!confirmado) return;
      this.produccionService.deleteProduccion(uuid).subscribe({
        next: () => {
          this.loadProducciones();
          this.alertaService.evaluarYGenerarAlertas().subscribe();
          this.toast.success('Producción eliminada.', 'Eliminado');
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error al eliminar producción', 'Error');
          this.cdr.detectChanges();
        },
      });
    });
  }
}
