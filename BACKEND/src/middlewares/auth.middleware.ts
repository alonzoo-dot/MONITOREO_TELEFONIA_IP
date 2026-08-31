import type { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../utils/jwt';

/** Valida el token dado (misma firma/expiración/payload que el header) y adjunta el usuario. */
function validarYAdjuntarUsuario(
  token: string,
  peticion: Request,
  respuesta: Response,
  siguiente: NextFunction,
): void {
  try {
    const datos = verificarToken(token);
    peticion.usuario = datos; // adjunta el usuario para los controladores
    siguiente(); // deja pasar a la siguiente etapa
  } catch {
    respuesta.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
}

/** Middleware que exige un token válido (header Authorization) y adjunta el usuario a la petición. */
export function requiereAutenticacion(
  peticion: Request,
  respuesta: Response,
  siguiente: NextFunction,
): void {
  const encabezado = peticion.headers.authorization;

  // El token viaja como: "Bearer <token>"
  if (!encabezado || !encabezado.startsWith('Bearer ')) {
    respuesta.status(401).json({ mensaje: 'Token no proporcionado' });
    return;
  }

  const token = encabezado.substring(7); // quita "Bearer "
  validarYAdjuntarUsuario(token, peticion, respuesta, siguiente);
}

/**
 * Variante para endpoints SSE: el EventSource del navegador no admite headers
 * personalizados, así que el token puede viajar en el query string (?token=...).
 * Si no viene ahí, cae al comportamiento normal del header Authorization.
 */
export function autenticarConToken(
  peticion: Request,
  respuesta: Response,
  siguiente: NextFunction,
): void {
  const tokenQuery = peticion.query.token;

  if (typeof tokenQuery === 'string' && tokenQuery !== '') {
    validarYAdjuntarUsuario(tokenQuery, peticion, respuesta, siguiente);
    return;
  }

  requiereAutenticacion(peticion, respuesta, siguiente);
}
