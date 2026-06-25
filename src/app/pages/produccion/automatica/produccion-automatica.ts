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
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-produccion-automatica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './produccion-automatica.html',
  styleUrl: './produccion-automatica.css'
})
export class ProduccionAutomaticaComponent implements OnInit, OnDestroy {
  // Conectividad con Python
  pythonConnected = false;
  isSimulation = true;
  currentWeight = 0.0;
  currentCategory = 'N/A';
  pythonBaseUrl = 'http://localhost:5000';
  videoFeedUrl = `${this.pythonBaseUrl}/video_feed`;
  selectedCameraIndex = 0;
  availableCameras: { index: number; label: string }[] = [];
  
  // Datos del Formulario
  lotes: Lote[] = [];
  selectedLoteId: number | null = null;
  selectedFecha: string = '';
  usuarios: Usuario[] = [];
  usuariosAutorizados: Usuario[] = [];
  
  // Servicios
  auth = inject(AuthService);
  private produccionService = inject(ProduccionService);
  private loteService = inject(LoteService);
  private usersService = inject(UsersService);
  private alertaService = inject(AlertaService);
  private visionService = inject(VisionService);
  private cdr = ChangeDetectorRef;

  // Estado de la Sesión
  scannedEggs: any[] = [];
  sessionCounts: { [key: string]: number } = {
    jumbo: 0,
    aaa: 0,
    aa: 0,
    a: 0,
    b: 0,
    c: 0
  };
  totalSessionEggs = 0;
  lastScanCount = 0;
  
  // Polling Interval
  private pollingIntervalId: any;
  loading = false;
  error: string | null = null;
  isTransitioningCamera = false;

  // Simulación
  simWeightInput = 62.5;

  constructor(private changeDetector: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.selectedFecha = new Date().toISOString().substring(0, 10);
    this.loadLotes();
    this.loadUsuarios();
    
    // Activar bandera de transición inicial para dar tiempo a que cargue EasyOCR
    this.isTransitioningCamera = true;
    setTimeout(() => {
      this.isTransitioningCamera = false;
    }, 4500);
    
    // Detectar cámaras y luego arrancar la seleccionada
    this.detectarCamaras().then(() => {
      this.iniciarCamara();
    });
    
    // Iniciar polling del script de Python cada 300ms
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
      next: (res) => {
        console.log('Detector de peso iniciado:', res.message);
      },
      error: (err) => {
        console.error('Error al iniciar detector de peso:', err);
      }
    });
  }

  detenerCamara(): void {
    this.visionService.stopCamera().subscribe({
      next: (res) => {
        console.log('Detector de peso detenido:', res.message);
      },
      error: (err) => {
        console.error('Error al detener detector de peso:', err);
      }
    });
  }

  cambiarCamara(): void {
    this.pythonConnected = false;
    this.isTransitioningCamera = true;
    this.iniciarCamara();
    
    // Dar un tiempo de 4.5 segundos para que la cámara USB / PC se apague e inicie la otra
    setTimeout(() => {
      this.isTransitioningCamera = false;
    }, 4500);
  }

  async detectarCamaras(): Promise<void> {
    try {
      // Solicitar permiso temporal para obtener los nombres reales de las cámaras
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Apagar inmediatamente la prueba
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      this.availableCameras = videoDevices.map((device, index) => {
        let label = device.label || `Cámara ${index + 1}`;
        // Limpiar el label quitando paréntesis, corchetes y números identificadores
        label = label.replace(/\s*\([^)]*\)/g, ''); // Quita paréntesis: (0bda:d511)
        label = label.replace(/\s*\[[^\]]*\]/g, ''); // Quita corchetes
        label = label.replace(/\s*\d+:\d+/g, ''); // Quita IDs de hardware sueltos
        return {
          index: index,
          label: label.trim()
        };
      });
      
      // Si no hay cámaras detectadas, añadir un fallback
      if (this.availableCameras.length === 0) {
        this.availableCameras = [{ index: 0, label: 'Cámara Principal' }];
      }
    } catch (e) {
      console.warn('Permisos de cámara denegados o no hay dispositivos:', e);
      this.availableCameras = [
        { index: 0, label: 'Cámara Principal' },
        { index: 1, label: 'Cámara Secundaria' }
      ];
    }
    this.changeDetector.detectChanges();
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: any) {
    const token = this.auth.getToken();
    if (token) {
      // Usar keepalive fetch para garantizar el cierre al cerrar pestaña
      fetch(`${environment.apiUrl}/vision/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        keepalive: true
      });
    }
  }

  // Escuchar teclado en el documento para acciones en tiempo real
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Si el usuario está escribiendo en un input o select, no registrar
    const targetElement = event.target as HTMLElement;
    if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'SELECT' || targetElement.tagName === 'TEXTAREA') {
      return;
    }

    if (!this.pythonConnected) return;

    const key = event.key.toLowerCase();

    if (event.code === 'Space' || event.key === ' ') {
      event.preventDefault(); // Evitar scroll de la página
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
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ direction: direction })
    }).catch(err => console.warn('Error al mover ROI:', err));
  }

  loadLotes(): void {
    this.loteService.getLotes({ limit: 100 }).subscribe({
      next: (response) => {
        this.lotes = response.data;
        if (this.lotes.length > 0) {
          this.selectedLoteId = this.lotes[0].id_lote;
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
    this.usersService.getUsers({ limit: 100 }).subscribe({
      next: (response) => {
        this.usuarios = response.data;
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

  // Consulta el estado en tiempo real del script Python
  async pollPythonStatus(): Promise<void> {
    if (this.isTransitioningCamera) {
      return;
    }
    try {
      const response = await fetch(`${this.pythonBaseUrl}/status`);
      if (!response.ok) {
        throw new Error('Servidor no responde correctamente');
      }
      
      const data = await response.json();
      this.pythonConnected = true;
      this.currentWeight = data.weight;
      this.currentCategory = data.category;
      this.isSimulation = data.is_simulation;
      
      // Si el contador de escaneos de Python aumentó, significa que se presionó Espacio en OpenCV
      if (data.scan_count > this.lastScanCount) {
        this.lastScanCount = data.scan_count;
        this.scannedEggs = data.scanned_eggs;
        this.recalcularContadoresDesdeSesion();
        
        // Efecto visual flash opcional
        this.triggerFlashEffect();
      }
      this.changeDetector.detectChanges();
    } catch (e) {
      if (this.pythonConnected) {
        this.pythonConnected = false;
        this.changeDetector.detectChanges();
      }
    }
  }

  // Recalcula los totales de la sesión según el listado del Python
  recalcularContadoresDesdeSesion(): void {
    // Reiniciar
    this.sessionCounts = { jumbo: 0, aaa: 0, aa: 0, a: 0, b: 0, c: 0 };
    this.totalSessionEggs = this.scannedEggs.length;
    
    for (const egg of this.scannedEggs) {
      const cat = egg.category.toLowerCase();
      if (this.sessionCounts[cat] !== undefined) {
        this.sessionCounts[cat]++;
      }
    }
  }

  // Envia comando al script Python para registrar el peso actual
  async registrarHuevoActual(): Promise<void> {
    if (!this.pythonConnected) {
      alert('El servidor de la cámara no está conectado. No se puede registrar.');
      return;
    }
    
    try {
      const response = await fetch(`${this.pythonBaseUrl}/register`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      console.error('Error al registrar huevo:', e);
    }
  }

  // Cambia el modo de operación en el script Python (Real <-> Simulación)
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

  // Define un peso simulado en el script Python
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

  // Reinicia la sesión de escaneo actual
  async reiniciarSesion(): Promise<void> {
    if (confirm('¿Está seguro de reiniciar los contadores de la sesión actual? Se perderá el historial no guardado.')) {
      if (this.pythonConnected) {
        try {
          await fetch(`${this.pythonBaseUrl}/clear`, { method: 'POST' });
        } catch (e) {
          console.error(e);
        }
      }
      this.scannedEggs = [];
      this.sessionCounts = { jumbo: 0, aaa: 0, aa: 0, a: 0, b: 0, c: 0 };
      this.totalSessionEggs = 0;
      this.lastScanCount = 0;
      this.changeDetector.detectChanges();
    }
  }

  // Guarda los contadores acumulados en la base de datos de Postgres
  guardarProduccionEnBaseDatos(): void {
    if (this.auth.isVisitante()) {
      alert('Los visitantes no tienen permisos para guardar.');
      return;
    }
    
    if (!this.selectedLoteId) {
      alert('Debe seleccionar un lote.');
      return;
    }
    
    if (this.totalSessionEggs <= 0) {
      alert('No hay huevos registrados en la sesión actual para guardar.');
      return;
    }

    this.loading = true;
    this.changeDetector.detectChanges();

    // 1. Verificar si ya existe producción para este lote y fecha
    this.produccionService.getProducciones({
      lote: this.selectedLoteId,
      fecha: this.selectedFecha,
      limit: 1
    }).subscribe({
      next: (response) => {
        const activeUser = this.auth.getUser();
        const defaultCreator = this.usuariosAutorizados.find(u => String(u.id) === String(activeUser?.id)) || this.usuariosAutorizados[0];
        
        if (response.data && response.data.length > 0) {
          // Ya existe un registro. Actualizamos sumando los huevos de esta sesión.
          const registroExistente = response.data[0];
          const confirmacion = confirm(
            `Ya existe un registro de producción para el Lote ${this.selectedLoteId} el día ${this.selectedFecha}.\n` +
            `¿Desea SUMAR los huevos de esta sesión al registro existente?\n` +
            `Existentes: ${registroExistente.total} huevos. Nuevos: ${this.totalSessionEggs} huevos.`
          );

          if (!confirmacion) {
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

          this.produccionService.updateProduccion(registroExistente.id_produccion, payload).subscribe({
            next: () => {
              this.finalizarGuardadoExitoso();
            },
            error: (err) => {
              this.manejarErrorGuardado(err);
            }
          });

        } else {
          // No existe registro. Creamos uno nuevo.
          const payload = {
            fecha: this.selectedFecha,
            lote_id: Number(this.selectedLoteId),
            creado_por: defaultCreator?.id || '',
            jumbo: this.sessionCounts['jumbo'],
            aaa: this.sessionCounts['aaa'],
            aa: this.sessionCounts['aa'],
            a: this.sessionCounts['a'],
            b: this.sessionCounts['b'],
            c: this.sessionCounts['c']
          };

          this.produccionService.createProduccion(payload).subscribe({
            next: () => {
              this.finalizarGuardadoExitoso();
            },
            error: (err) => {
              this.manejarErrorGuardado(err);
            }
          });
        }
      },
      error: (err) => {
        this.manejarErrorGuardado(err);
      }
    });
  }

  private finalizarGuardadoExitoso(): void {
    this.loading = false;
    alert('Producción guardada correctamente en la Base de Datos.');
    this.alertaService.evaluarYGenerarAlertas().subscribe();
    
    // Preguntar si quiere limpiar la sesión actual
    if (confirm('¿Desea limpiar la sesión actual para iniciar una nueva recolección?')) {
      if (this.pythonConnected) {
        fetch(`${this.pythonBaseUrl}/clear`, { method: 'POST' }).catch(() => {});
      }
      this.scannedEggs = [];
      this.sessionCounts = { jumbo: 0, aaa: 0, aa: 0, a: 0, b: 0, c: 0 };
      this.totalSessionEggs = 0;
      this.lastScanCount = 0;
    }
    this.changeDetector.detectChanges();
  }

  private manejarErrorGuardado(err: any): void {
    this.loading = false;
    console.error('Error al guardar producción:', err);
    const errorMsg = err.error?.message || 'Error en la comunicación con el servidor';
    alert(Array.isArray(errorMsg) ? errorMsg.join('\n') : errorMsg);
    this.changeDetector.detectChanges();
  }

  // Efecto flash visual para cuando se escanea un huevo
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
    if (!user) return 'Desconocido';
    const fullUser = this.usuariosAutorizados.find(u => String(u.id) === String(user.id));
    if (fullUser?.nombre) return fullUser.nombre;
    return user.username;
  }
}
