export interface Galpon {
  id_galpon?: number;
  id?: string;
  nombre: string;
  direccion: string;
  capacidad?: number;
  gallinasActuales?: number;
  tipo?: string;
  activo?: boolean;
  lote?: any;
  fecha_creacion?: Date | string;
  createdAt?: Date;
  updatedAt?: Date;
  uuid?: string;
}

export interface FilterGalponParams {
  nombre?: string;
  direccion?: string;
  lote?: string;
}
