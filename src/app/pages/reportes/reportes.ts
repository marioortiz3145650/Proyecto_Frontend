import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProduccionService } from '../../services/produccion';
import { LoteService } from '../../services/lote';
import { MovimientoInsumoService } from '../../services/movimiento-insumo';
import { MuerteService } from '../../services/muerte';
import { Lote } from '../../interfaces/lote.interface';
import { Produccion } from '../../interfaces/produccion.interface';
import { Muerte } from '../../interfaces/muerte.interface';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements OnInit {
  auth = inject(AuthService);
  lotes: Lote[] = [];
  producciones: Produccion[] = [];
  movimientos: any[] = [];
  muertes: Muerte[] = [];

  loading = true;
  error: string | null = null;

  // Filtros del reporte
  filtros = {
    fecha_inicio: '',
    fecha_fin: '',
    lote_id: '' as string | number,
    tipo_reporte: 'todo'
  };

  // Resultados calculados
  reporte = {
    totalProduccion: 0,
    promedioDiario: 0,
    totalConsumoAlimento: 0,
    totalMuerte: 0,
    tasaMortalidad: 0,
    totalGallinasIniciales: 0,

    // Categorización de huevos
    jumbo: 0,
    aaa: 0,
    aa: 0,
    a: 0,
    b: 0,
    c: 0,

    // Desgloses porcentuales
    porcentajeJumbo: 0,
    porcentajeAAA: 0,
    porcentajeAA: 0,
    porcentajeA: 0,
    porcentajeB: 0,
    porcentajeC: 0,

    // Agrupaciones para gráficos visuales customizados
    produccionPorDia: [] as { fecha: string; total: number; pct: number }[],
    mortalidadPorCausa: [] as { causa: string; cantidad: number }[],
    resumenLotes: [] as {
      id_lote: number;
      raza: string;
      gallinas: number;
      produccion: number;
      mortalidad: number;
      consumo: number;
    }[]
  };

  constructor(
    private produccionService: ProduccionService,
    private loteService: LoteService,
    private movimientoInsumoService: MovimientoInsumoService,
    private muerteService: MuerteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Establecer fechas por defecto: primer día del mes actual y hoy
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    this.filtros.fecha_inicio = primerDiaMes.toISOString().substring(0, 10);
    this.filtros.fecha_fin = hoy.toISOString().substring(0, 10);

    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      lotes: this.loteService.getLotes({ limit: 1000 }),
      producciones: this.produccionService.getProducciones({ limit: 1000 }),
      movimientos: this.movimientoInsumoService.getMovimientos(),
      muertes: this.muerteService.getMuertes({ limit: 1000 })
    }).subscribe({
      next: (res) => {
        this.lotes = res.lotes.data || [];
        this.producciones = res.producciones.data || [];
        this.movimientos = res.movimientos || [];
        this.muertes = res.muertes.data || [];

        this.calcularReporte();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar datos de reportes:', err);
        this.error = 'Ocurrió un error al cargar la información histórica. Intente de nuevo.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calcularReporte(): void {
    const inicio = this.filtros.fecha_inicio ? new Date(this.filtros.fecha_inicio) : null;
    const fin = this.filtros.fecha_fin ? new Date(this.filtros.fecha_fin) : null;
    if (fin) fin.setHours(23, 59, 59, 999); // incluir todo el día de fin
    
    const loteId = this.filtros.lote_id !== '' ? Number(this.filtros.lote_id) : null;

    // 1. Filtrar registros por fecha y lote
    const produccionesFiltradas = this.producciones.filter(p => {
      const fechaP = new Date(p.fecha);
      const coincideFecha = (!inicio || fechaP >= inicio) && (!fin || fechaP <= fin);
      const coincideLote = loteId === null || p.lote?.id_lote === loteId;
      return coincideFecha && coincideLote;
    });

    const movimientosFiltrados = this.movimientos.filter(m => {
      const fechaM = new Date(m.fecha);
      const coincideFecha = (!inicio || fechaM >= inicio) && (!fin || fechaM <= fin);
      
      const movLoteId = m.lote?.id_lote || m.lote_id;
      const coincideLote = loteId === null || Number(movLoteId) === loteId;
      const esConsumo = m.tipo_movimiento === 'CONSUMO' || m.tipo_movimiento === 'SALIDA';
      return coincideFecha && coincideLote && esConsumo;
    });

    const muertesFiltradas = this.muertes.filter(mu => {
      const fechaMu = new Date(mu.fecha);
      const coincideFecha = (!inicio || fechaMu >= inicio) && (!fin || fechaMu <= fin);
      const muLoteId = mu.lote?.id_lote;
      const coincideLote = loteId === null || (muLoteId !== undefined && Number(muLoteId) === loteId);
      return coincideFecha && coincideLote;
    });

    const lotesFiltrados = this.lotes.filter(l => {
      return loteId === null || l.id_lote === loteId;
    });

    // 2. Calcular Totales y Categorías de Huevos
    let totalProd = 0;
    let jumbo = 0;
    let aaa = 0;
    let aa = 0;
    let a = 0;
    let b = 0;
    let c = 0;

    produccionesFiltradas.forEach(p => {
      totalProd += p.total || 0;
      jumbo += p.jumbo || 0;
      aaa += p.aaa || 0;
      aa += p.aa || 0;
      a += p.a || 0;
      b += p.b || 0;
      c += p.c || 0;
    });

    this.reporte.totalProduccion = totalProd;
    this.reporte.jumbo = jumbo;
    this.reporte.aaa = aaa;
    this.reporte.aa = aa;
    this.reporte.a = a;
    this.reporte.b = b;
    this.reporte.c = c;

    // Porcentajes
    if (totalProd > 0) {
      this.reporte.porcentajeJumbo = Math.round((jumbo / totalProd) * 100);
      this.reporte.porcentajeAAA = Math.round((aaa / totalProd) * 100);
      this.reporte.porcentajeAA = Math.round((aa / totalProd) * 100);
      this.reporte.porcentajeA = Math.round((a / totalProd) * 100);
      this.reporte.porcentajeB = Math.round((b / totalProd) * 100);
      this.reporte.porcentajeC = Math.round((c / totalProd) * 100);
    } else {
      this.reporte.porcentajeJumbo = 0;
      this.reporte.porcentajeAAA = 0;
      this.reporte.porcentajeAA = 0;
      this.reporte.porcentajeA = 0;
      this.reporte.porcentajeB = 0;
      this.reporte.porcentajeC = 0;
    }

    // Promedio Diario
    if (inicio && fin) {
      const diffTime = Math.abs(fin.getTime() - inicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      this.reporte.promedioDiario = Math.round(totalProd / diffDays);
    } else {
      this.reporte.promedioDiario = totalProd;
    }

    // 3. Consumo Alimento
    let totalConsumo = 0;
    movimientosFiltrados.forEach(m => {
      totalConsumo += Number(m.cantidad || 0);
    });
    this.reporte.totalConsumoAlimento = totalConsumo;

    // 4. Mortalidad
    let totalMuertes = 0;
    muertesFiltradas.forEach(mu => {
      totalMuertes += Number(mu.cantidad || 0);
    });
    this.reporte.totalMuerte = totalMuertes;

    // Tasa Mortalidad
    let totalGallinas = 0;
    lotesFiltrados.forEach(l => {
      totalGallinas += Number(l.total_gallinas || 0);
    });
    this.reporte.totalGallinasIniciales = totalGallinas;
    this.reporte.tasaMortalidad = totalGallinas > 0 
      ? Math.round((totalMuertes / totalGallinas) * 10000) / 100 // 2 decimales
      : 0;

    // 5. Agrupación Producción por Día (para el mini-gráfico)
    const agrupadoDia: { [key: string]: number } = {};
    produccionesFiltradas.forEach(p => {
      const fechaStr = new Date(p.fecha).toISOString().substring(0, 10);
      agrupadoDia[fechaStr] = (agrupadoDia[fechaStr] || 0) + (p.total || 0);
    });

    const ordenadoDias = Object.keys(agrupadoDia)
      .sort()
      .map(fecha => ({
        fecha: this.formatearFechaCorta(fecha),
        total: agrupadoDia[fecha],
        pct: 0
      }));

    const maxVal = Math.max(...ordenadoDias.map(d => d.total), 1);
    ordenadoDias.forEach(d => {
      d.pct = Math.round((d.total / maxVal) * 100);
    });
    this.reporte.produccionPorDia = ordenadoDias.slice(-10); // mostrar últimos 10 días de producción

    // 6. Agrupación Muertes por Causa
    const agrupadoCausa: { [key: string]: number } = {};
    muertesFiltradas.forEach(m => {
      const causa = m.causa || 'No especificada';
      agrupadoCausa[causa] = (agrupadoCausa[causa] || 0) + Number(m.cantidad || 0);
    });
    this.reporte.mortalidadPorCausa = Object.keys(agrupadoCausa).map(causa => ({
      causa,
      cantidad: agrupadoCausa[causa]
    }));

    // 7. Resumen de Lotes individual
    this.reporte.resumenLotes = lotesFiltrados.map(l => {
      const id = l.id_lote;
      
      const prodLote = this.producciones
        .filter(p => p.lote?.id_lote === id && (!inicio || new Date(p.fecha) >= inicio) && (!fin || new Date(p.fecha) <= fin))
        .reduce((sum, p) => sum + (p.total || 0), 0);

      const muertLote = this.muertes
        .filter(m => m.lote?.id_lote === id && (!inicio || new Date(m.fecha) >= inicio) && (!fin || new Date(m.fecha) <= fin))
        .reduce((sum, m) => sum + Number(m.cantidad || 0), 0);

      const consLote = this.movimientos
        .filter(m => {
          const movLoteId = m.lote?.id_lote || m.lote_id;
          const coincideLote = Number(movLoteId) === id;
          const coincideFecha = (!inicio || new Date(m.fecha) >= inicio) && (!fin || new Date(m.fecha) <= fin);
          const esConsumo = m.tipo_movimiento === 'CONSUMO' || m.tipo_movimiento === 'SALIDA';
          return coincideLote && coincideFecha && esConsumo;
        })
        .reduce((sum, m) => sum + Number(m.cantidad || 0), 0);

      return {
        id_lote: id,
        raza: l.raza?.nombre_raza || 'N/A',
        gallinas: l.total_gallinas || 0,
        produccion: prodLote,
        mortalidad: muertLote,
        consumo: consLote
      };
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
    const loteLabel = f.lote_id ? 'Lote ' + f.lote_id : 'Todos los lotes';

    const formatNum = (n: number) => n.toLocaleString('es-CO');

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
      categoriasHtml =
        '<h3 class="section-title">Distribuci&oacute;n por Categor&iacute;as</h3>' +
        '<table class="table"><thead><tr><th>Categor&iacute;a</th><th>Cantidad</th><th>%</th></tr></thead><tbody>' +
        '<tr><td>Jumbo</td><td>' + formatNum(r.jumbo) + '</td><td>' + r.porcentajeJumbo + '%</td></tr>' +
        '<tr><td>AAA</td><td>' + formatNum(r.aaa) + '</td><td>' + r.porcentajeAAA + '%</td></tr>' +
        '<tr><td>AA</td><td>' + formatNum(r.aa) + '</td><td>' + r.porcentajeAA + '%</td></tr>' +
        '<tr><td>A</td><td>' + formatNum(r.a) + '</td><td>' + r.porcentajeA + '%</td></tr>' +
        '<tr><td>B</td><td>' + formatNum(r.b) + '</td><td>' + r.porcentajeB + '%</td></tr>' +
        '<tr><td>C</td><td>' + formatNum(r.c) + '</td><td>' + r.porcentajeC + '%</td></tr>' +
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
