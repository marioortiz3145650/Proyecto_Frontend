import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CierreService } from '../../../services/cierre.service';
import { Cierre } from '../../../interfaces/cierre.interface';

@Component({
  selector: 'app-cierres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cierres.html',
  styleUrl: './cierres.css',
})
export class Cierres implements OnInit {
  cierres: Cierre[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private cierreService: CierreService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCierres();
  }

  loadCierres(): void {
    this.loading = true;
    this.error = null;

    this.cierreService.getCierres().subscribe({
      next: (data) => {
        this.cierres = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar cierres:', err);
        this.error = 'Error al cargar cierres de lotes';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}