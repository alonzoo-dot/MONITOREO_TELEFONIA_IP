/** Datos del usuario que devuelve el backend tras un login exitoso. */
export interface UsuarioAutenticado {
  id_usuario: number;
  usuario: string;
  nombre_completo: string;
  tipo_rol: string;
}

/** Respuesta completa del endpoint de login. */
export interface RespuestaLogin {
  token: string;
  debe_cambiar_password: boolean;
  usuario: UsuarioAutenticado;
}