import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoteService } from '../../services/lote';
import { ProduccionService } from '../../services/produccion';
import { AlimentoService } from '../../services/alimento';
import { MuerteService } from '../../services/muerte';
import { AlertaService } from '../../services/alerta';
import { Lote } from '../../interfaces/lote.interface';
import { Produccion } from '../../interfaces/produccion.interface';
import { Alimento } from '../../interfaces/alimento.interface';
import { Muerte } from '../../interfaces/muerte.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  // Métricas
  totalLotesActivos = 0;
  totalLotesCerrados = 0;
  totalGallinas = 0;
  totalGalpones = 0;
  totalAlertas = 0;

  // Producción
  produccionReciente: Produccion[] = [];
  totalHuevosHoy = 0;

  // Muertes
  muertesRecientes: Muerte[] = [];
  totalMuertesRecientes = 0;

  // Alimentos
  alimentosBajoStock: Alimento[] = [];

  // Lotes
  lotes: Lote[] = [];

  loading = true;
  fechaHoy = new Date();

  constructor(
    private loteService: LoteService,
    private produccionService: ProduccionService,
    private alimentoService: AlimentoService,
    private muerteService: MuerteService,
    private alertaService: AlertaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;

    this.alertaService.getAlertas({ page: 1, limit: 1 }).subscribe({
      next: (res) => {
        this.totalAlertas = res.meta?.total || 0;
        this.cdr.detectChanges();
      },
      error: () => {
        this.totalAlertas = 0;
        this.cdr.detectChanges();
      }
    });

    this.loteService.getLotes({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.lotes = res.data;
        this.totalLotesActivos = res.data.filter(l => !l.fecha_fin).length;
        this.totalLotesCerrados = res.data.filter(l => !!l.fecha_fin).length;
        this.totalGallinas = res.data
          .filter(l => !l.fecha_fin)
          .reduce((sum, l) => sum + (l.total_gallinas || 0), 0);
        this.cdr.detectChanges();
      }
    });

    this.produccionService.getProducciones({ page: 1, limit: 5, sortBy: 'fecha', order: 'DESC' }).subscribe({
      next: (res) => {
        this.produccionReciente = res.data;
        this.totalHuevosHoy = res.data.reduce((sum, p) => sum + (p.total || 0), 0);
        this.cdr.detectChanges();
      }
    });

    this.muerteService.getMuertes({ page: 1, limit: 5, sortBy: 'fecha', order: 'DESC' }).subscribe({
      next: (res) => {
        this.muertesRecientes = res.data;
        this.totalMuertesRecientes = res.data.reduce((sum, m) => sum + (m.cantidad || 0), 0);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });

    this.alimentoService.getAlimentos({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.alimentosBajoStock = res.data.filter(a => a.stock_actual <= a.stock_minimo);
        this.cdr.detectChanges();
      }
    });
  }
}