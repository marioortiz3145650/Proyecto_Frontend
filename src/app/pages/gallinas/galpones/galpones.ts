import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GalponService } from '../../../services/galpon.service';
import { Galpon, FilterGalponParams } from '../../../interfaces/galpon.interface';
import { PaginatedResponse, PaginationMeta, PaginationParams } from '../../../interfaces/pagination.interface';

@Component({
  selector: 'app-galpones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './galpones.html',
  styleUrl: './galpones.css',
})
export class Galpones implements OnInit {
  galpones: Galpon[] = [];
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

  filtros: FilterGalponParams = {};

  pages: number[] = [];

  Math = Math; // Para usar en el template

  constructor(private galponService: GalponService) {}

  ngOnInit(): void {
    this.cargarGalpones();
  }

  cargarGalpones(): void {
    const params: PaginationParams & Partial<FilterGalponParams> = {
      page: this.page,
      limit: this.limit,
      sortBy: this.sortBy,
      order: this.sortOrder,
      ...this.filtros,
    };

    this.galponService.getGalpones(params).subscribe({
      next: (response: PaginatedResponse<Galpon>) => {
        this.galpones = response.data;
        this.meta = response.meta;
        this.generarPaginas();
      },
      error: (error) => {
        console.error('Error al cargar galpones:', error);
      },
    });
  }

  aplicarFiltros(): void {
    this.page = 1;
    this.cargarGalpones();
  }

  limpiarFiltros(): void {
    this.filtros = {};
    this.page = 1;
    this.cargarGalpones();
  }

  ordenarPor(campo: string): void {
    if (this.sortBy === campo) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = campo;
      this.sortOrder = 'ASC';
    }
    this.cargarGalpones();
  }

  cambiarPagina(page: number): void {
    if (page < 1 || page > this.meta.totalPages) return;
    this.page = page;
    this.cargarGalpones();
  }

  cambiarLimite(): void {
    this.page = 1;
    this.cargarGalpones();
  }

  generarPaginas(): void {
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