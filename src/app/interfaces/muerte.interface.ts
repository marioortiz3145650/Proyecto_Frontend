import { Lote } from './lote.interface';
import { Usuario } from './usuario.interface';

export interface Muerte {
  id_muerte: number;
  fecha: string | Date;
  cantidad: number;
  causa: string;
  usuario?: Usuario;
  lote?: Lote;
}

export interface FilterMuerteParams {
  fecha?: string;
  lote?: number;
  causa?: string;
}
