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
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ChartModule],
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

  // Chart Data
  produccionChartData: any;
  muertesChartData: any;
  alimentosChartData: any;
  lotesChartData: any;
  chartOptions: any;
  pieOptions: any;

  constructor(
    private loteService: LoteService,
    private produccionService: ProduccionService,
    private alimentoService: AlimentoService,
    private muerteService: MuerteService,
    private alertaService: AlertaService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initChartOptions();
    this.cargarDatos();
  }

  initChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#6c757d';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#dfe7ef';

    this.chartOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor } }
      },
      scales: {
        x: {
          ticks: { color: textColorSecondary, font: { weight: 500 } },
          grid: { color: surfaceBorder, drawBorder: false }
        },
        y: {
          beginAtZero: true,
          ticks: { color: textColorSecondary },
          grid: { color: surfaceBorder, drawBorder: false }
        }
      }
    };

    this.pieOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { usePointStyle: true, color: textColor } }
      }
    };
  }

  formatFecha(fecha: string | Date): string {
    if (!fecha) return '';
    const dateStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(fecha).toLocaleDateString();
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
        const lotesActivos = res.data.filter(l => !l.fecha_fin);
        this.totalLotesActivos = lotesActivos.length;
        this.totalLotesCerrados = res.data.filter(l => !!l.fecha_fin).length;
        this.totalGallinas = lotesActivos.reduce((sum, l) => sum + (l.total_gallinas || 0), 0);

        this.lotesChartData = {
          labels: lotesActivos.map(l => `Lote ${l.id_lote}`),
          datasets: [
            {
              data: lotesActivos.map(l => l.total_gallinas || 0),
              backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#26C6DA', '#7E57C2'],
              hoverBackgroundColor: ['#64B5F6', '#81C784', '#FFB74D', '#4DD0E1', '#9575CD']
            }
          ]
        };
        this.cdr.detectChanges();
      }
    });

    this.produccionService.getProducciones({ page: 1, limit: 15, sortBy: 'fecha', order: 'ASC' }).subscribe({
      next: (res) => {
        this.produccionReciente = res.data;
        this.totalHuevosHoy = res.data.length > 0 ? res.data[res.data.length - 1].total || 0 : 0;

        this.produccionChartData = {
          labels: res.data.map(p => this.formatFecha(p.fecha)),
          datasets: [
            {
              label: 'Huevos Producidos',
              data: res.data.map(p => p.total),
              fill: true,
              backgroundColor: 'rgba(66, 165, 245, 0.2)',
              borderColor: '#1E88E5',
              borderWidth: 2,
              tension: 0.4
            }
          ]
        };
        this.cdr.detectChanges();
      }
    });

    this.muerteService.getMuertes({ page: 1, limit: 15, sortBy: 'fecha', order: 'ASC' }).subscribe({
      next: (res) => {
        this.muertesRecientes = res.data;
        this.totalMuertesRecientes = res.data.reduce((sum, m) => sum + (m.cantidad || 0), 0);

        this.muertesChartData = {
          labels: res.data.map(m => this.formatFecha(m.fecha)),
          datasets: [
            {
              label: 'Bajas',
              data: res.data.map(m => m.cantidad),
              fill: false,
              borderColor: '#FFA726',
              tension: 0.4
            }
          ]
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });

    this.alimentoService.getAlimentos({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.alimentosBajoStock = res.data.filter(a => a.stock_actual <= a.stock_minimo);

        this.alimentosChartData = {
          labels: this.alimentosBajoStock.map(a => a.nombre),
          datasets: [
            {
              label: 'Stock Actual',
              backgroundColor: '#ef4444',
              data: this.alimentosBajoStock.map(a => a.stock_actual)
            },
            {
              label: 'Stock Mínimo',
              backgroundColor: '#cbd5e1',
              data: this.alimentosBajoStock.map(a => a.stock_minimo)
            }
          ]
        };
        this.cdr.detectChanges();
      }
    });
  }
}