import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MuerteService } from '../../services/muerte';
import { LoteService } from '../../services/lote';
import { UsersService } from '../../services/users';
import { TratamientoService, Tratamiento } from '../../services/tratamiento';
import { Muerte, FilterMuerteParams } from '../../interfaces/muerte.interface';
import { Lote } from '../../interfaces/lote.interface';
import { Usuario } from '../../interfaces/usuario.interface';
import { PaginationMeta, PaginationParams } from '../../interfaces/pagination.interface';
import { AuthService } from '../../services/auth.service';
import { AlertaService } from '../../services/alerta';

@Component({
  selector: 'app-salud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './salud.html',
  styleUrl: './salud.css',
})
export class Salud implements OnInit {
  auth = inject(AuthService);
  private alertaService = inject(AlertaService);
  activeTab = 'muertes'; // 'muertes' o 'tratamientos'

  // Datos
  muertes: Muerte[] = [];
  tratamientos: Tratamiento[] = [];
  lotes: Lote[] = [];
  usuarios: Usuario[] = [];

  // Usuarios autorizados para crear/editar registros
  usuariosAutorizados: Usuario[] = [];

  // Paginación Muertes
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
  filtros: FilterMuerteParams = {};
  pages: number[] = [];

  // Estados generales
  loading = true; // Empieza en true para evitar ExpressionChangedAfterItHasBeenCheckedError
  loadingMuertes = false;
  loadingTratamientos = false;
  error: string | null = null;
  Math = Math;

  // Modal Muertes
  mostrarModalMuerte = false;
  muerteEditando: Muerte | null = null;
  muerteForm = {
    fecha: '',
    cantidad: 1,
    causa: '',
    loteId: undefined as number | undefined,
    usuarioId: undefined as string | undefined,
  };

  // Modal Tratamientos
  mostrarModalTratamiento = false;
  tratamientoEditando: Tratamiento | null = null;
  tratamientoForm = {
    fecha: '',
    tratamiento: '',
    lote_id: undefined as number | undefined,
    estado_id: 1,
    creado_por: 1,
  };

  guardando = false;

  constructor(
    private muerteService: MuerteService,
    private loteService: LoteService,
    private usersService: UsersService,
    private tratamientoService: TratamientoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = null;

    const muertesParams: PaginationParams & Partial<FilterMuerteParams> = {
      page: this.page,
      limit: this.limit,
      sortBy: this.sortBy,
      order: this.sortOrder,
    };

    forkJoin({
      lotes: this.loteService.getLotes({ limit: 100 }),
      usuarios: this.usersService.getUsers({ limit: 100 }),
      muertes: this.muerteService.getMuertes(muertesParams),
      tratamientos: this.tratamientoService.getTratamientos()
    }).subscribe({
      next: (res) => {
        this.lotes = res.lotes.data || [];
        this.usuarios = res.usuarios.data || [];
        this.usuariosAutorizados = this.usuarios.filter(u => {
          const rolNombre = this.getRolName(u.rol);
          return rolNombre === 'Administrador' || rolNombre === 'Aprendiz';
        });
        this.muertes = res.muertes.data || [];
        this.meta = res.muertes.meta;
        this.generatePages();
        this.tratamientos = res.tratamientos || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al inicializar modulo de salud:', err);
        this.error = 'Error al cargar información de salud';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.error = null;
  }

  // --- CARGA DE CATÁLOGOS ---
  loadLotes(): void {
    this.loteService.getLotes({ limit: 100 }).subscribe({
      next: (response) => {
        this.lotes = response.data;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.error = 'Error al cargar lotes';
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  loadUsuarios(): void {
    this.usersService.getUsers({ limit: 100 }).subscribe({
      next: (response) => {
        this.usuarios = response.data;
        this.usuariosAutorizados = this.usuarios.filter(u => {
          const rolNombre = this.getRolName(u.rol);
          return rolNombre === 'Administrador' || rolNombre === 'Aprendiz';
        });
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.error = 'Error al cargar usuarios';
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  // --- CRUD MUERTES ---
  loadMuertes(): void {
    this.loadingMuertes = true;
    this.error = null;

    const params: PaginationParams & Partial<FilterMuerteParams> = {
      page: this.page,
      limit: this.limit,
      sortBy: this.sortBy,
      order: this.sortOrder,
    };

    if (this.filtros.lote !== undefined && this.filtros.lote !== null) {
      params.lote = this.filtros.lote;
    }
    if (this.filtros.fecha) params.fecha = this.filtros.fecha;

    this.muerteService.getMuertes(params).subscribe({
      next: (response) => {
        this.muertes = response.data;
        this.meta = response.meta;
        this.generatePages();
        this.loadingMuertes = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.error = 'Error al cargar historial de mortalidad';
        this.loadingMuertes = false;
        setTimeout(() => this.cdr.detectChanges());
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

  abrirModalCrearMuerte(): void {
    if (this.auth.isVisitante()) return;
    this.muerteEditando = null;
    const activeUser = this.auth.getUser();
    const defaultCreator = this.usuariosAutorizados.find(u => String(u.id) === String(activeUser?.id)) || this.usuariosAutorizados[0];
    this.muerteForm = {
      fecha: new Date().toISOString().substring(0, 10),
      cantidad: 1,
      causa: '',
      loteId: this.lotes.length > 0 ? this.lotes[0].id_lote : undefined,
      usuarioId: defaultCreator?.id,
    };
    this.mostrarModalMuerte = true;
    this.cdr.detectChanges();
  }

  abrirModalEditarMuerte(muerte: Muerte): void {
    if (this.auth.isVisitante()) return;
    this.muerteEditando = muerte;
    const creatorId = muerte.usuario?.id || (this.auth.getUser()?.id ? String(this.auth.getUser()?.id) : undefined);
    this.muerteForm = {
      fecha: muerte.fecha ? new Date(muerte.fecha).toISOString().substring(0, 10) : '',
      cantidad: muerte.cantidad,
      causa: muerte.causa,
      loteId: muerte.lote?.id_lote,
      usuarioId: creatorId,
    };
    this.mostrarModalMuerte = true;
    this.cdr.detectChanges();
  }

  get activeUserNombre(): string {
    const user = this.auth.getUser();
    if (!user) return 'Desconocido';
    const fullUser = this.usuariosAutorizados.find(u => String(u.id) === String(user.id));
    if (fullUser?.nombre) return fullUser.nombre;
    return user.username.toLowerCase() === 'admin' ? 'Administrador Sistema' : user.username;
  }

  cerrarModalMuerte(): void {
    this.mostrarModalMuerte = false;
    this.guardando = false;
    this.cdr.detectChanges();
  }

  guardarMuerte(): void {
    if (this.auth.isVisitante()) return;
    if (this.guardando) return;
    if (!this.muerteForm.loteId) return;

    this.guardando = true;

    const payload: any = {
      fecha: this.muerteForm.fecha,
      cantidad: Number(this.muerteForm.cantidad),
      causa: this.muerteForm.causa,
      loteId: Number(this.muerteForm.loteId),
    };

    // Al crear enviamos usuarioId del usuario activo, al editar no lo enviamos para no sobrescribir el creador original
    if (!this.muerteEditando) {
      const activeUser = this.auth.getUser();
      payload.usuarioId = activeUser?.id ? String(activeUser.id) : undefined;
    }

    if (this.muerteEditando) {
      this.muerteService.updateMuerte(this.muerteEditando.id_muerte, payload).subscribe({
        next: () => {
          this.cerrarModalMuerte();
          this.loadMuertes();
          this.alertaService.evaluarYGenerarAlertas().subscribe();
        },
        error: () => { this.error = 'Error al actualizar registro de muerte'; this.guardando = false; this.cdr.detectChanges(); },
      });
    } else {
      this.muerteService.createMuerte(payload).subscribe({
        next: () => {
          this.cerrarModalMuerte();
          this.loadMuertes();
          this.alertaService.evaluarYGenerarAlertas().subscribe();
        },
        error: () => { this.error = 'Error al registrar muerte'; this.guardando = false; this.cdr.detectChanges(); },
      });
    }
  }

  eliminarMuerte(id: number): void {
    if (this.auth.isVisitante()) return;
    if (confirm('¿Está seguro de que desea eliminar este registro de bajas?')) {
      this.muerteService.deleteMuerte(id).subscribe({
        next: () => {
          this.loadMuertes();
          this.alertaService.evaluarYGenerarAlertas().subscribe();
        },
        error: () => {
          this.error = 'Error al eliminar registro';
          this.cdr.detectChanges();
        },
      });
    }
  }

  // --- CRUD TRATAMIENTOS ---
  loadTratamientos(): void {
    this.loadingTratamientos = true;
    this.error = null;

    this.tratamientoService.getTratamientos().subscribe({
      next: (response) => {
        this.tratamientos = response || [];
        this.loadingTratamientos = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar tratamientos médicos';
        this.loadingTratamientos = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalCrearTratamiento(): void {
    if (this.auth.isVisitante()) return;
    this.tratamientoEditando = null;
    const activeUser = this.auth.getUser();
    const defaultCreator = this.usuariosAutorizados.find(u => String(u.id) === String(activeUser?.id)) || this.usuariosAutorizados[0];
    this.tratamientoForm = {
      fecha: new Date().toISOString().substring(0, 10),
      tratamiento: '',
      lote_id: this.lotes.length > 0 ? this.lotes[0].id_lote : undefined,
      estado_id: 1,
      creado_por: Number(defaultCreator?.id) || 1,
    };
    this.mostrarModalTratamiento = true;
    this.cdr.detectChanges();
  }

  abrirModalEditarTratamiento(t: Tratamiento): void {
    if (this.auth.isVisitante()) return;
    this.tratamientoEditando = t;
    this.tratamientoForm = {
      fecha: t.fecha ? new Date(t.fecha).toISOString().substring(0, 10) : '',
      tratamiento: t.tratamiento,
      lote_id: t.lote_id,
      estado_id: t.estado_id || 1,
      creado_por: t.creado_por || 1
    };
    this.mostrarModalTratamiento = true;
    this.cdr.detectChanges();
  }

  cerrarModalTratamiento(): void {
    this.mostrarModalTratamiento = false;
    this.guardando = false;
    this.cdr.detectChanges();
  }

  guardarTratamiento(): void {
    if (this.auth.isVisitante()) return;
    if (this.guardando) return;
    if (!this.tratamientoForm.lote_id) return;

    this.guardando = true;

    const payload: any = {
      fecha: this.tratamientoForm.fecha,
      tratamiento: this.tratamientoForm.tratamiento,
      lote_id: Number(this.tratamientoForm.lote_id),
      estado_id: Number(this.tratamientoForm.estado_id),
    };

    // Al crear enviamos creado_por del usuario activo, al editar no para no sobrescribir el creador original
    if (!this.tratamientoEditando) {
      const activeUser = this.auth.getUser();
      payload.creado_por = activeUser?.id ? Number(activeUser.id) : 1;
    }

    if (this.tratamientoEditando) {
      this.tratamientoService.updateTratamiento(this.tratamientoEditando.id_tratamiento, payload).subscribe({
        next: () => { this.cerrarModalTratamiento(); this.loadTratamientos(); },
        error: () => { this.error = 'Error al actualizar tratamiento médico'; this.guardando = false; this.cdr.detectChanges(); },
      });
    } else {
      this.tratamientoService.createTratamiento(payload).subscribe({
        next: () => { this.cerrarModalTratamiento(); this.loadTratamientos(); },
        error: () => { this.error = 'Error al registrar tratamiento médico'; this.guardando = false; this.cdr.detectChanges(); },
      });
    }
  }

  eliminarTratamiento(id: number): void {
    if (this.auth.isVisitante()) return;
    if (confirm('¿Está seguro de que desea eliminar este tratamiento médico?')) {
      this.tratamientoService.deleteTratamiento(id).subscribe({
        next: () => {
          this.loadTratamientos();
        },
        error: () => {
          this.error = 'Error al eliminar tratamiento médico';
          this.cdr.detectChanges();
        }
      });
    }
  }

  getUsuarioDisplayName(user: any): string {
    if (!user) return 'N/A';
    const nombre = user.nombre || user.nombre_usuario || '';
    if (nombre.toLowerCase() === 'admin') {
      return 'Administrador Sistema';
    }
    return nombre;
  }

  getLoteName(loteId: number): string {
    const l = this.lotes.find(x => x.id_lote === loteId);
    return l ? `Lote ${l.id_lote} (${l.raza?.nombre_raza || ''})` : `Lote ${loteId}`;
  }

  getRolName(rol: any): string {
    if (!rol) return '';
    return typeof rol === 'object' ? (rol.nombre || '') : rol;
  }

  getRolConMayuscula(rol: any): string {
    const nombre = this.getRolName(rol);
    if (!nombre) return '';
    return nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();
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