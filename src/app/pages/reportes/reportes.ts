import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ReportesService, ReporteResumen, ProduccionDia } from '../../services/reporte';
import { LoteService } from '../../services/lote';
import { Lote } from '../../interfaces/lote.interface';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements OnInit {
  auth = inject(AuthService);
  loteService = inject(LoteService);
  private reportesService = inject(ReportesService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  error: string | null = null;

  lotes: Lote[] = [];

  filtros = {
    fecha_inicio: '',
    fecha_fin: '',
    lote_id: '' as string,
    tipo_reporte: 'todo'
  };

  reporte: ReporteResumen = {
    totalProduccion: 0,
    promedioDiario: 0,
    totalConsumoAlimento: 0,
    totalMuerte: 0,
    tasaMortalidad: 0,
    produccionPorDia: [],
    mortalidadPorCausa: [],
    resumenLotes: [],
  };

  get categoriaTotales() {
    const totals = { jumbo: 0, aaa: 0, aa: 0, a: 0, b: 0, c: 0 };
    if (this.reporte.produccionPorDia) {
      this.reporte.produccionPorDia.forEach((d) => {
        totals.jumbo += d.jumbo || 0;
        totals.aaa += d.aaa || 0;
        totals.aa += d.aa || 0;
        totals.a += d.a || 0;
        totals.b += d.b || 0;
        totals.c += d.c || 0;
      });
    }
    return totals;
  }

  get chartMaxTotal(): number {
    if (!this.reporte.produccionPorDia || this.reporte.produccionPorDia.length === 0) return 1;
    return Math.max(...this.reporte.produccionPorDia.map((d) => d.total), 1);
  }

  get totalCategorias(): number {
    const c = this.categoriaTotales;
    return c.jumbo + c.aaa + c.aa + c.a + c.b + c.c || 1;
  }

  get porcentajeJumbo(): number { return this.totalCategorias > 0 ? Math.round((this.categoriaTotales.jumbo / this.totalCategorias) * 100) : 0; }
  get porcentajeAAA(): number { return this.totalCategorias > 0 ? Math.round((this.categoriaTotales.aaa / this.totalCategorias) * 100) : 0; }
  get porcentajeAA(): number { return this.totalCategorias > 0 ? Math.round((this.categoriaTotales.aa / this.totalCategorias) * 100) : 0; }
  get porcentajeA(): number { return this.totalCategorias > 0 ? Math.round((this.categoriaTotales.a / this.totalCategorias) * 100) : 0; }
  get porcentajeB(): number { return this.totalCategorias > 0 ? Math.round((this.categoriaTotales.b / this.totalCategorias) * 100) : 0; }
  get porcentajeC(): number { return this.totalCategorias > 0 ? Math.round((this.categoriaTotales.c / this.totalCategorias) * 100) : 0; }

  getDiaPct(dia: ProduccionDia): number {
    const max = this.chartMaxTotal;
    return max > 0 ? Math.round((dia.total / max) * 100) : 0;
  }

  ngOnInit(): void {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.filtros.fecha_inicio = primerDiaMes.toISOString().substring(0, 10);
    this.filtros.fecha_fin = hoy.toISOString().substring(0, 10);

    this.loteService.getLotes().subscribe({
      next: (data) => {
        this.lotes = data.data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar lotes:', err);
      }
    });

    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = null;
    const loteId = this.filtros.lote_id !== '' ? String(this.filtros.lote_id) : undefined;

    this.reportesService.getResumen({
      fecha_inicio: this.filtros.fecha_inicio || undefined,
      fecha_fin: this.filtros.fecha_fin || undefined,
      lote_id: loteId,
    }).subscribe({
      next: (res) => {
        this.reporte = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar reporte:', err);
        const backendMsg = err.error?.message;
        this.error = backendMsg
          ? `Error (${err.status}): ${backendMsg}`
          : 'Ocurrió un error al cargar el reporte. Intente de nuevo.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatearFechaCorta(fechaStr: string): string {
    const partes = fechaStr.split('-');
    if (partes.length < 3) return fechaStr;
    return `${partes[2]}/${partes[1]}`;
  }

  imprimirReporte(): void {
    if (this.auth.isVisitante()) return;

    const styles = this.getPrintStyles();
    const content = this.buildPrintContent();
    const html = [
      '<!DOCTYPE html>',
      '<html><head>',
      '<meta charset="utf-8">',
      '<title>Reporte - Granja Avícola</title>',
      styles,
      '<style>',
      '  @page { margin: 0; }',
      '  html, body { margin: 0; padding: 0; background: white; }',
      '  body { padding: 0; font-family: Arial, sans-serif; color: #000; }',
      '  * { box-sizing: border-box; }',
      '  .print-page { display: flex; flex-direction: column; min-height: 100vh; padding: 15mm; }',
      '</style>',
      '</head>',
      '<body>',
      '<div class="print-page">',
      content,
      '</div>',
      '</body></html>'
    ].join('\n');

    const win = window.open('', '_blank');
    if (!win) {
      window.print();
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.onafterprint = () => win.close();
    win.print();
  }

  private getPrintStyles(): string {
    return '<link href="https://fonts.googleapis.com/css2?family=Inter:opsz@14..32&display=swap" rel="stylesheet">';
  }

  private buildPrintContent(): string {
    const r = this.reporte;
    const f = this.filtros;
    const solo = f.tipo_reporte;

    const rango = (f.fecha_inicio || '&mdash;') + ' al ' + (f.fecha_fin || '&mdash;');
    const loteLabel = f.lote_id
      ? (() => {
          const encontrado = this.lotes.find(l => l.uuid === f.lote_id);
          return encontrado
            ? 'Lote ' + encontrado.id_lote + ' (' + (encontrado.raza?.nombre_raza || '') + ')'
            : 'Lote ' + f.lote_id;
        })()
      : 'Todos los lotes';

    const formatNum = (n: number) => n.toLocaleString('es-CO');

    const totalJumbo = r.produccionPorDia.reduce((sum, d) => sum + d.jumbo, 0);
    const totalAAA = r.produccionPorDia.reduce((sum, d) => sum + d.aaa, 0);
    const totalAA = r.produccionPorDia.reduce((sum, d) => sum + d.aa, 0);
    const totalA = r.produccionPorDia.reduce((sum, d) => sum + d.a, 0);
    const totalB = r.produccionPorDia.reduce((sum, d) => sum + d.b, 0);
    const totalC = r.produccionPorDia.reduce((sum, d) => sum + d.c, 0);

    const metricas: string[] = [];
    if (solo === 'todo' || solo === 'produccion') {
      metricas.push(
        '<div class="metric"><div class="metric-label">Total Huevos</div><div class="metric-value">' + formatNum(r.totalProduccion) + '</div><div class="metric-sub">Huevos recolectados</div></div>',
        '<div class="metric"><div class="metric-label">Promedio Diario</div><div class="metric-value">' + formatNum(r.promedioDiario) + '</div><div class="metric-sub">Huevos / d&iacute;a</div></div>'
      );
    }
    if (solo === 'todo' || solo === 'alimentacion') {
      metricas.push(
        '<div class="metric"><div class="metric-label">Consumo Alimento</div><div class="metric-value">' + formatNum(r.totalConsumoAlimento) + ' kg</div><div class="metric-sub">Alimento suministrado</div></div>'
      );
    }
    if (solo === 'todo' || solo === 'mortalidad') {
      metricas.push(
        '<div class="metric"><div class="metric-label">Mortalidad</div><div class="metric-value">' + r.totalMuerte + '</div><div class="metric-sub">Tasa de ' + r.tasaMortalidad + '%</div></div>'
      );
    }

    let categoriasHtml = '';
    if (solo === 'todo' || solo === 'produccion') {
      const totalCategorias = totalJumbo + totalAAA + totalAA + totalA + totalB + totalC || 1;
      categoriasHtml =
        '<h3 class="section-title">Distribuci&oacute;n por Categor&iacute;as</h3>' +
        '<table class="table"><thead><tr><th>Categor&iacute;a</th><th>Cantidad</th><th>%</th></tr></thead><tbody>' +
        '<tr><td>Jumbo</td><td>' + formatNum(totalJumbo) + '</td><td>' + Math.round((totalJumbo / totalCategorias) * 100) + '%</td></tr>' +
        '<tr><td>AAA</td><td>' + formatNum(totalAAA) + '</td><td>' + Math.round((totalAAA / totalCategorias) * 100) + '%</td></tr>' +
        '<tr><td>AA</td><td>' + formatNum(totalAA) + '</td><td>' + Math.round((totalAA / totalCategorias) * 100) + '%</td></tr>' +
        '<tr><td>A</td><td>' + formatNum(totalA) + '</td><td>' + Math.round((totalA / totalCategorias) * 100) + '%</td></tr>' +
        '<tr><td>B</td><td>' + formatNum(totalB) + '</td><td>' + Math.round((totalB / totalCategorias) * 100) + '%</td></tr>' +
        '<tr><td>C</td><td>' + formatNum(totalC) + '</td><td>' + Math.round((totalC / totalCategorias) * 100) + '%</td></tr>' +
        '</tbody></table>';
    }

    let tablaLotesHtml = '';
    if (r.resumenLotes.length > 0) {
      const rows = r.resumenLotes.map(function(l) {
        return '<tr><td>Lote ' + l.id_lote + '</td><td>' + l.raza + '</td><td>' + formatNum(l.gallinas) + '</td><td>' + formatNum(l.produccion) + '</td><td>' + formatNum(l.consumo) + ' kg</td><td>' + l.mortalidad + '</td></tr>';
      }).join('');
      tablaLotesHtml =
        '<h3 class="section-title" style="margin-top:24px">Rendimiento de Lotes</h3>' +
        '<table class="table"><thead><tr><th>Lote</th><th>Raza</th><th>Gallinas</th><th>Huevos</th><th>Consumo</th><th>Muertes</th></tr></thead><tbody>' +
        rows +
        '</tbody></table>';
    }

    let causasHtml = '';
    if ((solo === 'todo' || solo === 'mortalidad') && r.mortalidadPorCausa.length > 0) {
      const rows = r.mortalidadPorCausa.map(function(c) {
        return '<tr><td>' + c.causa + '</td><td>' + c.cantidad + '</td></tr>';
      }).join('');
      causasHtml =
        '<h3 class="section-title" style="margin-top:24px">Mortalidad por Causa</h3>' +
        '<table class="table"><thead><tr><th>Causa</th><th>Gallinas</th></tr></thead><tbody>' +
        rows +
        '</tbody></table>';
    }

    const today = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    return [
      '<div class="print-report">',
      '<h1 style="margin:0 0 4px;font-size:22px;">🐔 Reporte de Producci&oacute;n</h1>',
      '<p style="margin:0 0 16px;color:#555;font-size:13px;">Rango: ' + rango + ' &nbsp;|&nbsp; ' + loteLabel + '</p>',
      '<div class="metrics-grid">' + metricas.join('') + '</div>',
      categoriasHtml,
      tablaLotesHtml,
      causasHtml,
      '<p style="margin-top:24px;font-size:11px;color:#999;text-align:center;">Generado el ' + today + '</p>',
      '</div>',
      '<style>',
      '  .print-report { max-width: 800px; margin: 0 auto; }',
      '  .metrics-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }',
      '  .metric { flex: 1; min-width: 160px; padding: 12px 16px; border: 1px solid #ddd; border-radius: 6px; border-left: 4px solid #198754; }',
      '  .metric-label { font-size: 11px; text-transform: uppercase; color: #666; font-weight: 600; letter-spacing: 0.5px; }',
      '  .metric-value { font-size: 24px; font-weight: 700; color: #000; margin: 4px 0; }',
      '  .metric-sub { font-size: 11px; color: #888; }',
      '  .section-title { font-size: 15px; margin: 0 0 8px; color: #333; }',
      '  .table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }',
      '  .table th, .table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #ddd; }',
      '  .table th { background: #f5f5f5; font-weight: 600; color: #444; }',
      '  .table tbody tr:last-child td { border-bottom: none; }',
      '</style>'
    ].join('\n');
  }
}
