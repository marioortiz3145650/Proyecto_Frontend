import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../services/users';
import { Usuario } from '../../interfaces/usuario.interface';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  searchQuery = '';
  loading = false;
  error: string | null = null;

  get usuariosFiltrados(): Usuario[] {
    if (!this.searchQuery.trim()) return this.usuarios;
    const q = this.searchQuery.toLowerCase().trim();
    return this.usuarios.filter(u =>
      (u.nombre && u.nombre.toLowerCase().includes(q)) ||
      (u.correo && u.correo.toLowerCase().includes(q)) ||
      (u.nombre_usuario && u.nombre_usuario.toLowerCase().includes(q)) ||
      this.getRolNombre(u.rol).toLowerCase().includes(q)
    );
  }

  // Unified Edit and Password Modal State
  editModalUser: Usuario | null = null;
  editForm = {
    nombre: '',
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
  };
  editError: string | null = null;
  guardando = false;

  getRolNombre(rol: any): string {
    if (!rol) return 'N/A';
    return typeof rol === 'object' && rol.nombre ? rol.nombre : rol;
  }

  constructor(
    private usersService: UsersService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    this.usersService.getActiveUsers().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar usuarios';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openEditModal(usuario: Usuario): void {
    this.editModalUser = usuario;
    this.editForm = {
      nombre: usuario.nombre,
      correo: usuario.correo || '',
      contrasena: '',
      confirmarContrasena: '',
    };
    this.editError = null;
    this.guardando = false;
    this.cdr.detectChanges();
  }

  closeEditModal(): void {
    this.editModalUser = null;
    this.editForm = {
      nombre: '',
      correo: '',
      contrasena: '',
      confirmarContrasena: '',
    };
    this.editError = null;
    this.guardando = false;
    this.cdr.detectChanges();
  }

  saveEdit(): void {
    if (!this.editModalUser) return;

    const payload: any = {};
    if (this.editForm.nombre !== this.editModalUser.nombre) {
      payload.nombre = this.editForm.nombre;
    }
    if (this.editForm.correo !== (this.editModalUser.correo || '')) {
      payload.correo = this.editForm.correo;
    }

    if (this.editForm.contrasena) {
      if (this.editForm.contrasena.length < 6) {
        this.editError = 'La contraseña debe tener al menos 6 caracteres.';
        this.cdr.detectChanges();
        return;
      }
      if (this.editForm.contrasena !== this.editForm.confirmarContrasena) {
        this.editError = 'Las contraseñas no coinciden.';
        this.cdr.detectChanges();
        return;
      }
      payload.contraseña = this.editForm.contrasena;
    }

    if (Object.keys(payload).length === 0) {
      this.closeEditModal();
      return;
    }

    this.guardando = true;
    this.usersService.updateUser(this.editModalUser.id, payload).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadUsers();
        this.toast.success('Usuario actualizado correctamente.');
      },
      error: (err: any) => {
        const msg = err.error?.message || 'No se pudo actualizar el usuario.';
        this.editError = Array.isArray(msg) ? msg.join('\n') : msg;
        this.guardando = false;
        this.cdr.detectChanges();
      },
    });
  }
}