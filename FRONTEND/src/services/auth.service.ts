import { peticionApi } from './api';
import type { RespuestaLogin } from '../types/auth';

/** Inicia sesión con usuario y contraseña. Devuelve el token y los datos del usuario. */
export function iniciarSesion(usuario: string, password: string): Promise<RespuestaLogin> {
  return peticionApi<RespuestaLogin>('/auth/login', {
    metodo: 'POST',
    cuerpo: { usuario, password },
  });
}

/** Cambia la contraseña del usuario autenticado.
 *  Para cambio voluntario se pasa passwordActual para forzado se omite. */
export function cambiarPassword(
  token: string,
  passwordNuevo: string,
  passwordActual?: string,
): Promise<{ mensaje: string }> {
  return peticionApi<{ mensaje: string }>('/auth/change-password', {
    metodo: 'POST',
    token,
    cuerpo: {
      password_nuevo: passwordNuevo,
      ...(passwordActual ? { password_actual: passwordActual } : {}),
    },
  });
}