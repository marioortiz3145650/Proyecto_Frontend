import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovimientoInsumoService } from '../../../services/movimiento-insumo';
import { AlimentoService } from '../../../services/alimento';
import { LoteService } from '../../../services/lote';
import { UsersService } from '../../../services/users';
import { UnidadMedidaService } from '../../../services/unidad-medida';
import { Alimento, UnidadMedida } from '../../../interfaces/alimento.interface';
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
  unidadesMedida: UnidadMedida[] = [];
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
    unidad_medida_id?: string | number;
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
  searchQuery = '';

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
    private unidadMedidaService: UnidadMedidaService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private dialog: DialogService
  ) { }

  ngOnInit(): void {
    this.loadAlimentos();
    this.loadUnidadesMedida();
    this.loadLotes();
    this.loadUsuarios();
    this.loadMovimientos();
  }

  loadUnidadesMedida(): void {
    this.unidadMedidaService.getUnidadesMedida().subscribe({
      next: (unidades) => {
        this.unidadesMedida = unidades;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar unidades de medida:', err),
    });
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

  loadMovimientos(showLoading = true): void {
    if (showLoading) {
      this.loading = true;
    }
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
      let matchSearch = true;
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        matchSearch = (
          String(m.id_movimiento).includes(q) ||
          (m.alimento?.nombre && m.alimento.nombre.toLowerCase().includes(q)) ||
          (m.lote?.id_lote && String(m.lote.id_lote).includes(q)) ||
          (m.observaciones && m.observaciones.toLowerCase().includes(q)) ||
          this.getUsuarioDisplayName(m.creado_por).toLowerCase().includes(q)
        );
      }
      return matchLote && matchInsumo && matchSearch;
    });
  }

  get alimentosConStock(): Alimento[] {
    return this.alimentos.filter(a => Number(a.stock_actual) > 0);
  }

  clearFilters(): void {
    this.filtroLoteId = undefined;
    this.filtroInsumoId = undefined;
    this.searchQuery = '';
    this.page = 1;
    this.cdr.detectChanges();
  }

  onInsumoChange(): void {
    if (!this.movimientoForm.insumo_id) return;
    const alim = this.alimentos.find(a => a.uuid === this.movimientoForm.insumo_id);
    if (alim && alim.unidad_medida) {
      this.movimientoForm.unidad_medida_id = alim.unidad_medida.uuid || alim.unidad_medida.id_unidad;
    }
  }

  getUnidadAbreviatura(m: any): string {
    if (m.alimento?.unidad_medida?.abreviatura) return m.alimento.unidad_medida.abreviatura;
    if (m.alimento?.unidad_medida?.nombre) return m.alimento.unidad_medida.nombre;
    if (m.unidad_medida?.abreviatura) return m.unidad_medida.abreviatura;
    if (m.unidad_medida?.nombre) return m.unidad_medida.nombre;

    // Búsqueda cruzada con el catálogo de alimentos cargado
    const alimUuid = m.alimento?.uuid || m.insumo_id;
    const alimId = m.alimento?.id_insumo;
    if (alimUuid || alimId) {
      const found = this.alimentos.find(a => 
        (alimUuid && a.uuid === alimUuid) || (alimId && a.id_insumo === alimId)
      );
      if (found?.unidad_medida?.abreviatura) return found.unidad_medida.abreviatura;
      if (found?.unidad_medida?.nombre) return found.unidad_medida.nombre;
    }
    return '';
  }

  abrirModalCrear(): void {
    if (this.auth.isVisitante()) return;
    const defaultInsumo = this.alimentosConStock.length > 0 ? this.alimentosConStock[0] : (this.alimentos.length > 0 ? this.alimentos[0] : undefined);
    const defaultUnidad = defaultInsumo?.unidad_medida?.uuid || defaultInsumo?.unidad_medida?.id_unidad;

    this.movimientoForm = {
      fecha: new Date().toISOString().substring(0, 10),
      cantidad: 0,
      tipo_movimiento: 'CONSUMO',
      observaciones: '',
      insumo_id: defaultInsumo?.uuid,
      lote_id: this.lotes.length > 0 ? this.lotes[0].uuid : undefined,
      unidad_medida_id: defaultUnidad,
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

  getFactorAEquivalente(unidad: string): number | null {
    if (!unidad) return null;
    const u = unidad.toLowerCase().trim();

    // Peso / Masa (Base = kg)
    if (['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos'].includes(u)) return 1.0;
    if (['g', 'gr', 'gramo', 'gramos'].includes(u)) return 0.001;
    if (['lb', 'lbs', 'libra', 'libras'].includes(u)) return 0.5; // Standard 1 lb = 0.5 kg (500 g) en comercio agropecuario
    if (['t', 'tn', 'tonelada', 'toneladas'].includes(u)) return 1000.0;
    if (['mg', 'miligramo', 'miligramos'].includes(u)) return 0.000001;

    // Volumen (Base = Litro)
    if (['l', 'lt', 'litro', 'litros'].includes(u)) return 1.0;
    if (['ml', 'mililitro', 'mililitros', 'cc'].includes(u)) return 0.001;

    return null;
  }

  convertirUnidades(cantidad: number, unidadOrigenStr: string, unidadDestinoStr: string): number {
    if (!cantidad || cantidad <= 0) return cantidad;
    if (!unidadOrigenStr || !unidadDestinoStr) return cantidad;

    const uOrigen = unidadOrigenStr.toLowerCase().trim();
    const uDestino = unidadDestinoStr.toLowerCase().trim();
    if (uOrigen === uDestino) return cantidad;

    const fOrigen = this.getFactorAEquivalente(unidadOrigenStr);
    const fDestino = this.getFactorAEquivalente(unidadDestinoStr);

    if (fOrigen !== null && fDestino !== null && fDestino > 0) {
      const cantidadEnBase = cantidad * fOrigen;
      return cantidadEnBase / fDestino;
    }

    return cantidad;
  }

  get conversionEquivalenciaText(): string | null {
    if (!this.movimientoForm.cantidad || this.movimientoForm.cantidad <= 0) return null;
    if (!this.movimientoForm.insumo_id || !this.movimientoForm.unidad_medida_id) return null;

    const alimento = this.alimentos.find(a => a.uuid === this.movimientoForm.insumo_id);
    if (!alimento || !alimento.unidad_medida) return null;

    const unidadBase = alimento.unidad_medida.abreviatura || alimento.unidad_medida.nombre;
    const unidadSeleccionadaObj = this.unidadesMedida.find(u => 
      String(u.uuid || u.id_unidad) === String(this.movimientoForm.unidad_medida_id)
    );
    const unidadSeleccionada = unidadSeleccionadaObj?.abreviatura || unidadSeleccionadaObj?.nombre;

    if (!unidadBase || !unidadSeleccionada) return null;
    if (unidadBase.toLowerCase().trim() === unidadSeleccionada.toLowerCase().trim()) return null;

    const cantidadConvertida = this.convertirUnidades(
      Number(this.movimientoForm.cantidad),
      unidadSeleccionada,
      unidadBase
    );

    return `Equivale a ${cantidadConvertida.toFixed(2)} ${unidadBase} (unidad base de inventario del alimento)`;
  }

  guardarMovimiento(): void {
    if (this.auth.isVisitante()) return;
    if (this.guardando) return;
    if (!this.movimientoForm.insumo_id || !this.movimientoForm.lote_id) return;

    const alimento = this.alimentos.find(a => a.uuid === this.movimientoForm.insumo_id);
    if (!alimento) return;

    const cantidadIngresada = Number(this.movimientoForm.cantidad);
    const unidadBaseObj = alimento.unidad_medida;
    const unidadBase = unidadBaseObj?.abreviatura || unidadBaseObj?.nombre || 'kg';

    const unidadSeleccionadaObj = this.unidadesMedida.find(u => 
      String(u.uuid || u.id_unidad) === String(this.movimientoForm.unidad_medida_id)
    );
    const unidadSeleccionada = unidadSeleccionadaObj?.abreviatura || unidadSeleccionadaObj?.nombre || unidadBase;

    // Realizar conversión a la unidad base del alimento si son distintas
    const cantidadEnBase = this.convertirUnidades(cantidadIngresada, unidadSeleccionada, unidadBase);

    if (cantidadEnBase > Number(alimento.stock_actual)) {
      this.toast.warning(
        `Stock insuficiente para "${alimento.nombre}". Stock actual: ${alimento.stock_actual} ${unidadBase}, solicitado: ${cantidadIngresada} ${unidadSeleccionada} (equivale a ${cantidadEnBase.toFixed(2)} ${unidadBase})`,
        'Stock insuficiente'
      );
      return;
    }

    this.guardando = true;
    let obsText = this.movimientoForm.observaciones || '';
    if (unidadSeleccionada.toLowerCase().trim() !== unidadBase.toLowerCase().trim()) {
      const notaConversion = `Registrado: ${cantidadIngresada} ${unidadSeleccionada}`;
      obsText = obsText ? `${obsText} (${notaConversion})` : notaConversion;
    }

    const payload: any = {
      fecha: this.movimientoForm.fecha,
      cantidad: cantidadEnBase,
      tipo_movimiento: this.movimientoForm.tipo_movimiento,
      observaciones: obsText,
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
        this.toast.success('Consumo registrado correctamente.');
        this.loadMovimientos(false);
        this.loadAlimentos();
        this.alertaService.evaluarYGenerarAlertas().subscribe();
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
          this.loadMovimientos(false);
          this.loadAlimentos();
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
