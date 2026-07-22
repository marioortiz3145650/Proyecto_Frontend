import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProduccionService } from '../../../services/produccion';
import { LoteService } from '../../../services/lote';
import { UsersService } from '../../../services/users';
import { Lote } from '../../../interfaces/lote.interface';
import { Usuario } from '../../../interfaces/usuario.interface';
import { AuthService } from '../../../services/auth.service';
import { AlertaService } from '../../../services/alerta';
import { VisionService } from '../../../services/vision.service';
import { ToastService } from '../../../services/toast.service';
import { DialogService } from '../../../services/dialog.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-produccion-automatica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './produccion-automatica.html',
  styleUrl: './produccion-automatica.css'
})
export class ProduccionAutomaticaComponent implements OnInit, OnDestroy {
  pythonConnected = false;
  isSimulation = true;
  currentWeight = 0.0;
  currentCategory = 'N/A';
  pythonBaseUrl = 'http://localhost:5000';
  videoFeedUrl = `${this.pythonBaseUrl}/video_feed`;
  selectedCameraIndex = 0;
  availableCameras: { index: number; label: string }[] = [];

  lotes: Lote[] = [];
  selectedLoteId: string | null = null;
  selectedFecha: string = '';
  usuarios: Usuario[] = [];
  usuariosAutorizados: Usuario[] = [];

  auth = inject(AuthService);
  private produccionService = inject(ProduccionService);
  private loteService = inject(LoteService);
  private usersService = inject(UsersService);
  private alertaService = inject(AlertaService);
  private visionService = inject(VisionService);
  private toast = inject(ToastService);
  private dialog = inject(DialogService);

  scannedEggs: any[] = [];
  sessionCounts: { [key: string]: number } = {
    jumbo: 0, aaa: 0, aa: 0, a: 0, b: 0, c: 0
  };
  totalSessionEggs = 0;
  lastScanCount = 0;

  private pollingIntervalId: any;
  loading = false;
  error: string | null = null;
  isTransitioningCamera = false;

  simWeightInput = 62.5;

  constructor(private changeDetector: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.selectedFecha = new Date().toISOString().substring(0, 10);
    this.loadLotes();
    this.loadUsuarios();

    this.isTransitioningCamera = true;
    setTimeout(() => {
      this.isTransitioningCamera = false;
    }, 4500);

    // Arranca la cámara por defecto primero, y una vez Flask está arriba,
    // pide la lista real de cámaras (nombres + índices verdaderos vía pygrabber/DirectShow)
    this.iniciarCamara();
    setTimeout(() => {
      this.detectarCamaras();
    }, 2500);

    this.pollingIntervalId = setInterval(() => {
      this.pollPythonStatus();
    }, 300);
  }

  ngOnDestroy(): void {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
    }
    this.detenerCamara();
  }

  iniciarCamara(): void {
    this.visionService.startCamera(this.selectedCameraIndex).subscribe({
      next: (res) => console.log('Detector de peso iniciado:', res.message),
      error: (err) => console.error('Error al iniciar detector de peso:', err)
    });
  }

  detenerCamara(): void {
    this.visionService.stopCamera().subscribe({
      next: (res) => console.log('Detector de peso detenido:', res.message),
      error: (err) => console.error('Error al detener detector de peso:', err)
    });
  }

  cambiarCamara(): void {
    this.pythonConnected = false;
    this.isTransitioningCamera = true;
    this.iniciarCamara();
    setTimeout(() => {
      this.isTransitioningCamera = false;
    }, 4500);
  }

  // Pide al backend Python la lista REAL de cámaras (nombre + índice DirectShow).
  // Escala solo: si se conectan 5 cámaras más, aparecen solas, con su nombre real.
  detectarCamaras(): void {
    this.visionService.listCameras().subscribe({
      next: (res) => {
        this.availableCameras = res.cameras.map(c => ({
          index: c.index,
          label: c.name
        }));
        if (this.availableCameras.length === 0) {
          this.availableCameras = [{ index: 0, label: 'Webcam USB' }];
        }
        this.changeDetector.detectChanges();
      },
      error: (err) => {
        console.error('Error al listar cámaras:', err);
        this.availableCameras = [{ index: 0, label: 'Webcam USB' }];
        this.changeDetector.detectChanges();
      }
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: any) {
    const token = this.auth.getToken();
    if (token) {
      fetch(`${environment.apiUrl}/vision/stop`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        keepalive: true
      });
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const targetElement = event.target as HTMLElement;
    if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'SELECT' || targetElement.tagName === 'TEXTAREA') {
      return;
    }
    if (!this.pythonConnected) return;

    const key = event.key.toLowerCase();

    if (event.code === 'Space' || event.key === ' ') {
      event.preventDefault();
      this.registrarHuevoActual();
    } else if (key === 'q') {
      event.preventDefault();
      this.detenerCamara();
    } else if (key === 'w' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.moverROI('up');
    } else if (key === 's' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.moverROI('down');
    } else if (key === 'a' || event.key === 'ArrowLeft') {
      event.preventDefault();
      this.moverROI('left');
    } else if (key === 'd' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.moverROI('right');
    }
  }

  moverROI(direction: string): void {
    fetch('http://localhost:5000/move_roi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction: direction })
    }).catch(err => console.warn('Error al mover ROI:', err));
  }

  loadLotes(): void {
    this.loteService.getLotes({ limit: 100 }).subscribe({
      next: (response) => {
        this.lotes = response.data;
        if (this.lotes.length > 0) {
          this.selectedLoteId = this.lotes[0].uuid || null;
        }
        this.changeDetector.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar lotes';
        this.changeDetector.detectChanges();
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
        this.changeDetector.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar usuarios';
        this.changeDetector.detectChanges();
      }
    });
  }

  async pollPythonStatus(): Promise<void> {
    if (this.isTransitioningCamera) return;
    try {
      const response = await fetch(`${this.pythonBaseUrl}/status`);
      if (!response.ok) throw new Error('Servidor no responde correctamente');

      const data = await response.json();
      
      const wasConnected = this.pythonConnected;
      this.pythonConnected = true;
      this.currentWeight = data.weight;
      this.currentCategory = data.category;
      this.isSimulation = data.is_simulation;

      if (!wasConnected) {
        // Detectar los nombres reales de las cámaras una vez se establece conexión
        this.detectarCamaras();
      }

      if (data.scan_count > this.lastScanCount) {
        this.lastScanCount = data.scan_count;
        this.scannedEggs = data.scanned_eggs;
        this.recalcularContadoresDesdeSesion();
        this.triggerFlashEffect();
      }
      this.changeDetector.detectChanges();
    } catch (e) {
      if (this.pythonConnected) {
        this.pythonConnected = false;
        this.toast.error('Se perdió la conexión con el detector.', 'Cámara desconectada');
        this.changeDetector.detectChanges();
      }
    }
  }

  recalcularContadoresDesdeSesion(): void {
    this.sessionCounts = { jumbo: 0, aaa: 0, aa: 0, a: 0, b: 0, c: 0 };
    this.totalSessionEggs = this.scannedEggs.length;
    for (const egg of this.scannedEggs) {
      const cat = egg.category.toLowerCase();
      if (this.sessionCounts[cat] !== undefined) {
        this.sessionCounts[cat]++;
      }
    }
  }

  async registrarHuevoActual(): Promise<void> {
    if (!this.pythonConnected) {
      this.toast.warning('El servidor de la cámara no está conectado. No se puede registrar.', 'Sin conexión');
      return;
    }
    try {
      const response = await fetch(`${this.pythonBaseUrl}/register`, { method: 'POST' });
      const data = await response.json();
      if (data.error) this.toast.error(data.error, 'Error de registro');
    } catch (e) {
      console.error('Error al registrar huevo:', e);
    }
  }

  async alternarModoPython(): Promise<void> {
    if (!this.pythonConnected) return;
    const nuevoModo = this.isSimulation ? 'real' : 'simulation';
    try {
      await fetch(`${this.pythonBaseUrl}/set_mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: nuevoModo })
      });
      this.pollPythonStatus();
    } catch (e) {
      console.error('Error al cambiar modo:', e);
    }
  }

  async enviarPesoSimulado(): Promise<void> {
    if (!this.pythonConnected) return;
    try {
      await fetch(`${this.pythonBaseUrl}/set_weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: this.simWeightInput })
      });
      this.pollPythonStatus();
    } catch (e) {
      console.error('Error al definir peso simulado:', e);
    }
  }

  reiniciarSesion(): void {
    this.dialog.confirmDelete(
      'Se perderá el historial no guardado de la sesión actual.',
      '¿Reiniciar los contadores de la sesión actual?',
      'registro de sesión'
    ).subscribe((confirmado) => {
      if (!confirmado) return;
      if (this.pythonConnected) {
        fetch(`${this.pythonBaseUrl}/clear`, { method: 'POST' }).catch(() => {});
      }
      this.scannedEggs = [];
      this.sessionCounts = { jumbo: 0, aaa: 0, aa: 0, a: 0, b: 0, c: 0 };
      this.totalSessionEggs = 0;
      this.lastScanCount = 0;
      this.toast.success('Sesión reiniciada. Listo para una nueva recolección.', 'Sesión reiniciada');
      this.changeDetector.detectChanges();
    });
  }

  guardarProduccionEnBaseDatos(): void {
    if (this.auth.isVisitante()) {
      this.toast.warning('Los visitantes no tienen permisos para guardar.', 'Permiso denegado');
      return;
    }
    if (!this.selectedLoteId) {
      this.toast.warning('Debe seleccionar un lote antes de guardar.', 'Falta selección');
      return;
    }
    if (this.totalSessionEggs <= 0) {
      this.toast.warning('No hay huevos registrados en la sesión actual.', 'Sesión vacía');
      return;
    }

    this.loading = true;
    this.changeDetector.detectChanges();

    this.produccionService.getProducciones({
      lote: this.selectedLoteId,
      fecha: this.selectedFecha,
      limit: 1
    }).subscribe({
      next: (response) => {
        const activeUser = this.auth.getUser();
        const defaultCreator = this.usuariosAutorizados.find(u => String(u.uuid) === String(activeUser?.id)) || this.usuariosAutorizados[0];

        if (response.data && response.data.length > 0) {
          const registroExistente = response.data[0];
          const mensaje =
            `Ya existe un registro de producción para el Lote ${this.selectedLoteId} el día ${this.selectedFecha}.\n` +
            `¿Desea SUMAR los huevos de esta sesión al registro existente?\n` +
            `Existentes: ${registroExistente.total} huevos. Nuevos: ${this.totalSessionEggs} huevos.`;
          this.dialog.confirmDelete(
            mensaje,
            'Registro existente encontrado',
            'registro de producción'
          ).subscribe((confirmado) => {
            if (!confirmado) {
              this.loading = false;
              this.changeDetector.detectChanges();
              return;
            }

            const payload = {
              jumbo: (registroExistente.jumbo || 0) + this.sessionCounts['jumbo'],
              aaa: (registroExistente.aaa || 0) + this.sessionCounts['aaa'],
              aa: (registroExistente.aa || 0) + this.sessionCounts['aa'],
              a: (registroExistente.a || 0) + this.sessionCounts['a'],
              b: (registroExistente.b || 0) + this.sessionCounts['b'],
              c: (registroExistente.c || 0) + this.sessionCounts['c']
            };

            this.produccionService.updateProduccion(registroExistente.uuid!, payload).subscribe({
              next: () => this.finalizarGuardadoExitoso(),
              error: (err) => this.manejarErrorGuardado(err)
            });
          });
        } else {
          const payload = {
            fecha: this.selectedFecha,
            lote_id: this.selectedLoteId || '',
            creado_por: defaultCreator?.uuid || '',
            jumbo: this.sessionCounts['jumbo'],
            aaa: this.sessionCounts['aaa'],
            aa: this.sessionCounts['aa'],
            a: this.sessionCounts['a'],
            b: this.sessionCounts['b'],
            c: this.sessionCounts['c']
          };

          this.produccionService.createProduccion(payload).subscribe({
            next: () => this.finalizarGuardadoExitoso(),
            error: (err) => this.manejarErrorGuardado(err)
          });
        }
      },
      error: (err) => this.manejarErrorGuardado(err)
    });
  }

  private finalizarGuardadoExitoso(): void {
    this.loading = false;
    this.toast.success('Producción guardada correctamente en la Base de Datos.', 'Guardado');
    this.alertaService.evaluarYGenerarAlertas().subscribe();

    this.dialog.confirmDelete(
      'Se limpiará la sesión actual para iniciar una nueva recolección.',
      '¿Limpiar la sesión actual?',
      'registro de sesión'
    ).subscribe((confirmado) => {
      if (!confirmado) return;
      if (this.pythonConnected) {
        fetch(`${this.pythonBaseUrl}/clear`, { method: 'POST' }).catch(() => {});
      }
      this.scannedEggs = [];
      this.sessionCounts = { jumbo: 0, aaa: 0, aa: 0, a: 0, b: 0, c: 0 };
      this.totalSessionEggs = 0;
      this.lastScanCount = 0;
      this.changeDetector.detectChanges();
    });
  }

  private manejarErrorGuardado(err: any): void {
    this.loading = false;
    console.error('Error al guardar producción:', err);
    const errorMsg = err.error?.message || 'Error en la comunicación con el servidor';
    this.toast.error(Array.isArray(errorMsg) ? errorMsg.join('\n') : errorMsg, 'Error al guardar');
    this.changeDetector.detectChanges();
  }

  flashActive = false;
  triggerFlashEffect() {
    this.flashActive = true;
    this.changeDetector.detectChanges();
    setTimeout(() => {
      this.flashActive = false;
      this.changeDetector.detectChanges();
    }, 150);
  }

  get activeUserNombre(): string {
    const user = this.auth.getUser();
    return user?.nombre || user?.username || 'Desconocido';
  }
}