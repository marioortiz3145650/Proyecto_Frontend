import { Lote } from './lote.interface';
import { Usuario } from './usuario.interface';

export interface FilterProduccionParams {
  fecha?: string;
  lote?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface Produccion {
  id_produccion: number;
  fecha: string | Date;
  jumbo: number;
  aaa: number;
  aa: number;
  a: number;
  b: number;
  c: number;
  total: number;
  lote?: Lote;
  creado_por?: Usuario;
  fecha_registro: string | Date;
}

export interface FilterProduccionParams {
  fecha?: string;
  lote?: number;
}
