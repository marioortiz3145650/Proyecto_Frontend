import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService, Usuario } from '../../services/users';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  loading = false;
  error: string | null = null;

  constructor(private usersService: UsersService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    console.log('Iniciando carga de usuarios...');
    this.loading = true;
    this.error = null;
    this.cd.detectChanges();
    this.usersService.getUsers().subscribe({
      next: (data) => {
        console.log('Datos recibidos:', data);
        this.usuarios = data;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error en petición:', err);
        this.error = 'Error al cargar usuarios';
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  

  deactivateUser(id: string): void {
    this.usersService.deactivateUser(id).subscribe(() => {
      this.usuarios = this.usuarios.map(u =>
        u.id === id ? { ...u, activo: false } : u
      );
    });
  }

  activateUser(id: string): void {
    this.usersService.activateUser(id).subscribe(() => {
      this.usuarios = this.usuarios.map(u =>
        u.id === id ? { ...u, activo: true } : u
      );
    });
  }
}
