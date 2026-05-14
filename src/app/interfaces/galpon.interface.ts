export interface Galpon {
  id?: string;
  nombre: string;
  capacidad: number;
  gallinasActuales: number;
  tipo: string;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}