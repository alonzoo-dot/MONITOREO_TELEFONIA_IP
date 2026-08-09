import type { UsuarioAutenticado } from '../types/auth';

// Claves con las que guardamos los datos en localStorage
const CLAVE_TOKEN = 'monitoreo_token';
const CLAVE_USUARIO = 'monitoreo_usuario';

/** Guarda el token y los datos del usuario tras un login exitoso. */
export function guardarSesion(token: string, usuario: UsuarioAutenticado): void {
  localStorage.setItem(CLAVE_TOKEN, token);
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
}

/** Devuelve el token guardado, o null si no hay sesión. */
export function obtenerToken(): string | null {
  return localStorage.getItem(CLAVE_TOKEN);
}

/** Devuelve los datos del usuario guardado, o null si no hay sesión. */
export function obtenerUsuario(): UsuarioAutenticado | null {
  const datos = localStorage.getItem(CLAVE_USUARIO);
  return datos ? (JSON.parse(datos) as UsuarioAutenticado) : null;
}

/** Indica si hay una sesión activa (existe un token). */
export function haySesion(): boolean {
  return obtenerToken() !== null;
}

/** Borra la sesión (cierra sesión). */
export function cerrarSesion(): void {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
}