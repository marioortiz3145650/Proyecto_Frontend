export interface TipoAlimento {
  id_tipo_insumo: number;
  nombre: string;
}

export interface UnidadMedida {
  id_unidad: number;
  nombre: string;
  abreviatura: string;
}

export interface Alimento {
  id_insumo: number;
  nombre: string;
  tipo_alimento?: TipoAlimento;
  unidad_medida?: UnidadMedida;
  stock_actual: number;
  stock_minimo: number;
  precio_unitario: number;
}

export interface FilterAlimentoParams {
  nombre?: string;
  tipo_alimento?: number;
  unidad_medida?: number;
}
