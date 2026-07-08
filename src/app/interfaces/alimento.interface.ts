export interface TipoAlimento {
  id_tipo_insumo: number;
  nombre: string;
  uuid?: string;
}

export interface UnidadMedida {
  id_unidad: number;
  nombre: string;
  abreviatura: string;
  uuid?: string;
}

export interface Alimento {
  id_insumo: number;
  nombre: string;
  tipo_alimento?: TipoAlimento;
  unidad_medida?: UnidadMedida;
  stock_actual: number;
  stock_minimo: number;
  precio_unitario?: number;
  uuid?: string;
}
export interface FilterAlimentoParams {
  id_insumo?: number;
  tipo_alimento?: string;
  unidad_medida?: string;
}
