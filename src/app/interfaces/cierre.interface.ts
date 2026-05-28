export interface Cierre {
  id_cierre: number;
  lote_id: number;
  galpon_id: number;
  fecha_cierre: string | Date;
  fecha_inicio: string | Date;
  fecha_fin: string | Date;
  cantidad_inicial: number;
  cantidad_final: number;
  mortalidad_total: number;
  mortalidad_porcentaje: number;
  huevos_totales: number;
  promedio_produccion: number;
  semanas_produccion: number;
  alimento_consumido_total: number;
  conversion_alimenticia: number;
  costo_total: number;
  ingresos_totales: number;
  ganancia: number;
  observaciones?: string;
  usuario_cierre_id: number;
  fecha_registro: string | Date;
}
