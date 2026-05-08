export interface Usuario {
  id: string;
  nombre: string;
  correo?: string;
  nombre_usuario?: string;
  rol?: { id: string; nombre: string } | string;
  activo: boolean;
  fecha_registro?: string;
}