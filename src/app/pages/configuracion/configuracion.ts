import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoAlimentoService } from '../../services/tipo-alimento';
import { UnidadMedidaService } from '../../services/unidad-medida';
import { RazaService } from '../../services/raza';
import { TipoAlimento, UnidadMedida } from '../../interfaces/alimento.interface';
import { Raza } from '../../interfaces/raza.interface';

interface FarmSettings {
  farmName: string;
  ownerName: string;
  location: string;
  phone: string;
  maxMortalityRate: number;
  minPosturaRate: number;
  feedPerHen: number;
  currency: string;
  theme: string;
  language: string;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class Configuracion implements OnInit {
  activeTab = 'general'; // 'general', 'alertas', 'preferencias', 'tipos-alimento', 'unidades-medida', 'razas'
  saveSuccess = false;
  error: string | null = null;
  loading = false;
  guardando = false;

  settings: FarmSettings = {
    farmName: 'Granja Avícola El Porvenir',
    ownerName: 'Administrador Sena',
    location: 'Sede Principal - Regional Tolima',
    phone: '312 456 7890',
    maxMortalityRate: 5,
    minPosturaRate: 75,
    feedPerHen: 115,
    currency: 'COP',
    theme: 'light',
    language: 'es'
  };

  // Listas de catálogos
  tiposAlimento: TipoAlimento[] = [];
  unidadesMedida: UnidadMedida[] = [];
  razas: Raza[] = [];

  // Modales y formularios
  mostrarModalTipo = false;
  tipoEditando: TipoAlimento | null = null;
  tipoForm = {
    nombre: ''
  };

  mostrarModalUnidad = false;
  unidadEditando: UnidadMedida | null = null;
  unidadForm = {
    nombre: '',
    abreviatura: ''
  };

  mostrarModalRaza = false;
  razaEditando: Raza | null = null;
  razaForm = {
    nombre_raza: '',
    activo: true
  };

  constructor(
    private tipoAlimentoService: TipoAlimentoService,
    private unidadMedidaService: UnidadMedidaService,
    private razaService: RazaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadGeneralSettings();
    this.loadTiposAlimento();
    this.loadUnidadesMedida();
    this.loadRazas();
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.error = null;
  }

  // --- CONFIGURACIÓN GENERAL ---
  loadGeneralSettings(): void {
    const saved = localStorage.getItem('laying_hens_settings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Error parsing settings', e);
      }
    }
  }

  saveSettings(): void {
    localStorage.setItem('laying_hens_settings', JSON.stringify(this.settings));
    this.saveSuccess = true;
    setTimeout(() => {
      this.saveSuccess = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  // --- CRUD TIPOS DE ALIMENTO ---
  loadTiposAlimento(): void {
    this.loading = true;
    this.tipoAlimentoService.getTiposAlimento().subscribe({
      next: (res) => {
        this.tiposAlimento = res || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar tipos de alimento';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalCrearTipo(): void {
    this.tipoEditando = null;
    this.tipoForm = { nombre: '' };
    this.mostrarModalTipo = true;
    this.cdr.detectChanges();
  }

  abrirModalEditarTipo(t: TipoAlimento): void {
    this.tipoEditando = t;
    this.tipoForm = { nombre: t.nombre };
    this.mostrarModalTipo = true;
    this.cdr.detectChanges();
  }

  cerrarModalTipo(): void {
    this.mostrarModalTipo = false;
    this.guardando = false;
    this.cdr.detectChanges();
  }

  guardarTipoAlimento(): void {
    if (this.guardando) return;
    this.guardando = true;

    if (this.tipoEditando) {
      this.tipoAlimentoService.updateTipoAlimento(this.tipoEditando.id_tipo_insumo, this.tipoForm).subscribe({
        next: () => {
          this.cerrarModalTipo();
          this.loadTiposAlimento();
          this.showSuccessToast();
        },
        error: () => {
          this.error = 'Error al actualizar tipo de alimento';
          this.guardando = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.tipoAlimentoService.createTipoAlimento(this.tipoForm).subscribe({
        next: () => {
          this.cerrarModalTipo();
          this.loadTiposAlimento();
          this.showSuccessToast();
        },
        error: () => {
          this.error = 'Error al crear tipo de alimento';
          this.guardando = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  eliminarTipoAlimento(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este tipo de alimento? (Nota: Puede fallar si está en uso por insumos existentes)')) {
      this.tipoAlimentoService.deleteTipoAlimento(id).subscribe({
        next: () => {
          this.loadTiposAlimento();
          this.showSuccessToast();
        },
        error: () => {
          this.error = 'Error al eliminar. No se puede borrar porque está en uso por otros insumos.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  // --- CRUD UNIDADES DE MEDIDA ---
  loadUnidadesMedida(): void {
    this.loading = true;
    this.unidadMedidaService.getUnidadesMedida().subscribe({
      next: (res) => {
        this.unidadesMedida = res || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar unidades de medida';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalCrearUnidad(): void {
    this.unidadEditando = null;
    this.unidadForm = { nombre: '', abreviatura: '' };
    this.mostrarModalUnidad = true;
    this.cdr.detectChanges();
  }

  abrirModalEditarUnidad(u: UnidadMedida): void {
    this.unidadEditando = u;
    this.unidadForm = { nombre: u.nombre, abreviatura: u.abreviatura };
    this.mostrarModalUnidad = true;
    this.cdr.detectChanges();
  }

  cerrarModalUnidad(): void {
    this.mostrarModalUnidad = false;
    this.guardando = false;
    this.cdr.detectChanges();
  }

  guardarUnidadMedida(): void {
    if (this.guardando) return;
    this.guardando = true;

    if (this.unidadEditando) {
      this.unidadMedidaService.updateUnidadMedida(this.unidadEditando.id_unidad, this.unidadForm).subscribe({
        next: () => {
          this.cerrarModalUnidad();
          this.loadUnidadesMedida();
          this.showSuccessToast();
        },
        error: () => {
          this.error = 'Error al actualizar unidad de medida';
          this.guardando = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.unidadMedidaService.createUnidadMedida(this.unidadForm).subscribe({
        next: () => {
          this.cerrarModalUnidad();
          this.loadUnidadesMedida();
          this.showSuccessToast();
        },
        error: () => {
          this.error = 'Error al crear unidad de medida';
          this.guardando = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  eliminarUnidadMedida(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar esta unidad de medida? (Nota: Puede fallar si está en uso por insumos existentes)')) {
      this.unidadMedidaService.deleteUnidadMedida(id).subscribe({
        next: () => {
          this.loadUnidadesMedida();
          this.showSuccessToast();
        },
        error: () => {
          this.error = 'Error al eliminar. No se puede borrar porque está en uso por otros insumos.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  // --- CRUD RAZAS ---
  loadRazas(): void {
    this.loading = true;
    this.razaService.getRazasAll().subscribe({
      next: (res) => {
        this.razas = res || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar razas:', err);
        this.error = 'Error al cargar razas';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleRazaStatus(raza: Raza): void {
    const nuevoEstado = !raza.activo;
    this.razaService.updateRaza(raza.id_raza, { activo: nuevoEstado }).subscribe({
      next: () => {
        raza.activo = nuevoEstado;
        this.showSuccessToast();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cambiar estado de raza:', err);
      }
    });
  }

  abrirModalCrearRaza(): void {
    this.razaEditando = null;
    this.razaForm = { nombre_raza: '', activo: true };
    this.mostrarModalRaza = true;
    this.cdr.detectChanges();
  }

  abrirModalEditarRaza(raza: Raza): void {
    this.razaEditando = raza;
    this.razaForm = { nombre_raza: raza.nombre_raza, activo: raza.activo };
    this.mostrarModalRaza = true;
    this.cdr.detectChanges();
  }

  cerrarModalRaza(): void {
    this.mostrarModalRaza = false;
    this.guardando = false;
    this.cdr.detectChanges();
  }

  guardarRaza(): void {
    if (this.guardando) return;
    this.guardando = true;

    const payload: Partial<Raza> = {
      nombre_raza: this.razaForm.nombre_raza,
      activo: this.razaForm.activo
    };

    if (this.razaEditando) {
      this.razaService.updateRaza(this.razaEditando.id_raza, payload).subscribe({
        next: () => {
          this.cerrarModalRaza();
          this.loadRazas();
          this.showSuccessToast();
        },
        error: (err) => {
          console.error('Error al editar raza:', err);
          this.error = 'Error al editar raza';
          this.guardando = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.razaService.createRaza(payload).subscribe({
        next: () => {
          this.cerrarModalRaza();
          this.loadRazas();
          this.showSuccessToast();
        },
        error: (err) => {
          console.error('Error al crear raza:', err);
          this.error = 'Error al crear raza';
          this.guardando = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  eliminarRaza(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar esta raza?')) {
      this.razaService.deleteRaza(id).subscribe({
        next: () => {
          this.loadRazas();
          this.showSuccessToast();
        },
        error: (err) => {
          console.error('Error al eliminar raza:', err);
          const errorMsg = err.error?.message || 'No se pudo eliminar la raza.';
          this.error = Array.isArray(errorMsg) ? errorMsg.join('\n') : errorMsg;
          this.cdr.detectChanges();
        }
      });
    }
  }

  showSuccessToast(): void {
    this.saveSuccess = true;
    setTimeout(() => {
      this.saveSuccess = false;
      this.cdr.detectChanges();
    }, 3000);
  }
}