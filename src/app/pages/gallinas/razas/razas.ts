import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RazaService } from '../../../services/raza';
import { Raza } from '../../../interfaces/raza.interface';

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
    private cdr: ChangeDetectorRef
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
    this.razaService.updateRaza(raza.id_raza, { activo: nuevoEstado }).subscribe({
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
      this.razaService.updateRaza(this.razaEditando.id_raza, payload).subscribe({
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

  eliminarRaza(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar esta raza?')) {
      this.razaService.deleteRaza(id).subscribe({
        next: () => {
          this.loadRazas();
        },
        error: (err) => console.error('Error al eliminar raza:', err),
      });
    }
  }
}