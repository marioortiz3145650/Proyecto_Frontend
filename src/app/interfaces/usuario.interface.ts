export interface Usuario {
  id: string;
  nombre: string;
  correo?: string;
  nombre_usuario?: string;
  rol?: { id: string; nombre: string } | string;
  activo: boolean;
  fecha_registro?: string;
}

export interface FilterUsuarioParams {
  nombre?: string;
  correo?: string;
  nombre_usuario?: string;
  rol?: number;
  activo?: boolean;
  fecha_registro_inicio?: string;
  fecha_registro_fin?: string;
}
