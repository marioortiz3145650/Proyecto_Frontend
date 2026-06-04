import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoAlimentoService } from '../../services/tipo-alimento';
import { UnidadMedidaService } from '../../services/unidad-medida';
import { TipoAlimento, UnidadMedida } from '../../interfaces/alimento.interface';

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
  activeTab = 'general'; // 'general', 'alertas', 'preferencias', 'tipos-alimento', 'unidades-medida'
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

  constructor(
    private tipoAlimentoService: TipoAlimentoService,
    private unidadMedidaService: UnidadMedidaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadGeneralSettings();
    this.loadTiposAlimento();
    this.loadUnidadesMedida();
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

  showSuccessToast(): void {
    this.saveSuccess = true;
    setTimeout(() => {
      this.saveSuccess = false;
      this.cdr.detectChanges();
    }, 3000);
  }
}