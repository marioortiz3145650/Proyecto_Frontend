import { Lote } from './lote.interface';
import { Galpon } from './galpon.interface';
import { Usuario } from './usuario.interface';

export interface Alerta {
  id_alerta: number;
  titulo: string;
  mensaje: string;
  tipo: string; // 'stock', 'salud', 'produccion', etc.
  prioridad: string; // 'alta', 'media', 'baja'
  leida: boolean;
  fecha_creacion: string | Date;
  lote_id?: string;
  lote?: Lote;
  galpon_id?: string;
  galpon?: Galpon;
  uuid?: string;
}

export interface FilterAlertaParams {
  titulo?: string;
  tipo?: string;
  prioridad?: string;
  leida?: boolean;
}
