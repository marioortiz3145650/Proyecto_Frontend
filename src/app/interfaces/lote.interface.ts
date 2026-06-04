import { Raza } from './raza.interface';

export interface Lote {
  id_lote: number;
  raza?: Raza;
  edad_semanas: number;
  produccion_pct: number;
  fecha_inicio: string | Date;
  fecha_fin: string | Date | null;
  total_gallinas?: number;
  fecha_creacion: string | Date;
}

export interface FilterLoteParams {
  edad_semanas?: number;
  raza_id?: number;
}
