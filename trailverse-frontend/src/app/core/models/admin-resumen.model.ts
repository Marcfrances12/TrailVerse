export interface ResumenEntidad {
  total: number;
  activas: number;
  eliminadas: number;
}

export interface ResumenSalidas {
  total: number;
  proximas: number;
  abiertas: number;
  llenas: number;
}

export interface AdminResumen {
  rutas: ResumenEntidad;
  localizaciones: ResumenEntidad;
  categorias: ResumenEntidad;
  hosts: ResumenEntidad;
  usuarios: ResumenEntidad;
  salidas: ResumenSalidas;
}
