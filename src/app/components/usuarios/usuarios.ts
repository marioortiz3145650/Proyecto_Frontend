import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../services/users';
import { FilterUsuarioParams, Usuario } from '../../interfaces/usuario.interface';
import { PaginatedResponse, PaginationMeta, PaginationParams } from '../../interfaces/pagination.interface';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  meta: PaginationMeta = {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };

  page = 1;
  limit = 10;
  sortBy = 'nombre';
  sortOrder: 'ASC' | 'DESC' = 'ASC';

  filtros: FilterUsuarioParams = {};

  pages: number[] = [];
  loading = false;
  error: string | null = null;
  Math = Math;

  getRolNombre(rol: any): string {
    if (!rol) return 'N/A';
    return typeof rol === 'object' && rol.nombre ? rol.nombre : rol;
  }

  constructor(private usersService: UsersService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    const params: PaginationParams & Partial<FilterUsuarioParams> = {
      page: this.page,
      limit: this.limit,
      sortBy: this.sortBy,
      order: this.sortOrder,
      ...this.filtros,
    };

    this.usersService.getUsers(params).subscribe({
      next: (response: PaginatedResponse<Usuario>) => {
        this.usuarios = response.data;
        this.meta = response.meta;
        this.generatePages();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.error = 'Error al cargar usuarios';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadUsers();
  }

  clearFilters(): void {
    this.filtros = {};
    this.page = 1;
    this.loadUsers();
  }

  sortByField(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortOrder = 'ASC';
    }
    this.loadUsers();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.meta.totalPages) return;
    this.page = page;
    this.loadUsers();
  }

  changeLimit(): void {
    this.page = 1;
    this.loadUsers();
  }

   activateUser(id: string): void {
     this.usersService.activateUser(id).subscribe({
       next: () => {
         this.loadUsers();
         this.cdr.detectChanges();
       },
       error: (err) => console.error('Error al activar usuario:', err),
     });
   }

   deactivateUser(id: string): void {
     this.usersService.deactivateUser(id).subscribe({
       next: () => {
         this.loadUsers();
         this.cdr.detectChanges();
       },
       error: (err) => console.error('Error al desactivar usuario:', err),
     });
   }

   toggleUserStatus(usuario: Usuario): void {
     if (usuario.activo) {
       this.deactivateUser(usuario.id);
     } else {
       this.activateUser(usuario.id);
     }
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
