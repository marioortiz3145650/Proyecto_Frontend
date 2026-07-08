import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RazaService } from '../../../services/raza';
import { Raza } from '../../../interfaces/raza.interface';
import { DialogService } from '../../../services/dialog.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-razas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './razas.html',
  styleUrl: './razas.css',
})
export class Razas implements OnInit {
  razas: Raza[] = [];
  loading = false;
  error: string | null = null;

  // Variables para CRUD Modal
  mostrarModal = false;
  razaEditando: Raza | null = null;
  razaForm: {
    nombre_raza: string;
    activo: boolean;
  } = {
    nombre_raza: '',
    activo: true
  };

  constructor(
    private razaService: RazaService,
    private cdr: ChangeDetectorRef,
    private dialog: DialogService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadRazas();
  }

  loadRazas(): void {
  this.loading = true;
  this.error = null;

  this.razaService.getRazasAll().subscribe({
    next: (data) => {
      this.razas = data;
      this.loading = false;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Error al cargar razas:', err);
      this.error = 'Error al cargar razas';
      this.loading = false;
      this.cdr.detectChanges();
    },
  });
}

  toggleRazaStatus(raza: Raza): void {
    const nuevoEstado = !raza.activo;
    this.razaService.updateRaza(raza.uuid!, { activo: nuevoEstado }).subscribe({
      next: () => {
        raza.activo = nuevoEstado;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cambiar estado de raza:', err);
      },
    });
  }

  // Métodos CRUD
  abrirModalCrear(): void {
    this.razaEditando = null;
    this.razaForm = {
      nombre_raza: '',
      activo: true
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  abrirModalEditar(raza: Raza): void {
    this.razaEditando = raza;
    this.razaForm = {
      nombre_raza: raza.nombre_raza,
      activo: raza.activo
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.cdr.detectChanges();
  }

  guardarRaza(): void {
    const payload: Partial<Raza> = {
      nombre_raza: this.razaForm.nombre_raza,
      activo: this.razaForm.activo
    };

    if (this.razaEditando) {
      this.razaService.updateRaza(this.razaEditando.uuid!, payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.loadRazas();
        },
        error: (err) => console.error('Error al editar raza:', err),
      });
    } else {
      this.razaService.createRaza(payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.loadRazas();
        },
        error: (err) => console.error('Error al crear raza:', err),
      });
    }
  }

  eliminarRaza(uuid: string): void {
    this.dialog.confirmDelete(
      'Esta acción puede afectar a otros procesos o registros vinculados.',
      '¿Eliminar esta raza?',
      'raza'
    ).subscribe((confirmado) => {
      if (!confirmado) return;
      this.razaService.deleteRaza(uuid).subscribe({
        next: () => {
          this.loadRazas();
          this.toast.success('Raza eliminada correctamente.', 'Eliminado');
        },
        error: (err) => {
          console.error('Error al eliminar raza:', err);
          const errorMsg = err.error?.message || 'No se pudo eliminar la raza.';
          this.toast.error(Array.isArray(errorMsg) ? errorMsg.join('\n') : errorMsg, 'Error');
        },
      });
    });
  }
}