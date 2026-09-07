/** Nombre de rol tal como lo maneja el sistema. */
export type TipoRol = 'ADMINISTRADOR' | 'TECNICO';

/** Un usuario tal como lo devuelve el listado del backend. */
export interface Usuario {
  id_usuario: number;
  usuario: string;
  nombre_completo: string;
  tipo_rol: string;
  activo: boolean;
}

/** Datos para crear un usuario nuevo. El rol viaja como texto en la UI. */
export interface DatosNuevoUsuario {
  usuario: string;
  nombre_completo: string;
  rol: TipoRol;
}

/** Datos para editar un usuario existente. El nombre de usuario no se edita. */
export interface DatosEditarUsuario {
  nombre_completo: string;
  rol: TipoRol;
  activo: boolean;
}

/** Respuesta del backend al crear un usuario o al resetear su contrasena. */
export interface ResultadoPasswordTemporal {
  usuario?: string;
  password_temporal: string;
}

/** Filtros del listado que se aplican en el cliente. */
export interface FiltrosUsuario {
  busqueda: string;
  rol: '' | TipoRol;
  estado: 'activos' | 'inactivos' | 'todos';
}
