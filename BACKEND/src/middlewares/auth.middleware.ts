import type { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../utils/jwt';

/** Middleware que exige un token válido y adjunta el usuario a la petición. */
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

  try {
    const datos = verificarToken(token);
    peticion.usuario = datos; // adjunta el usuario para los controladores
    siguiente(); // deja pasar a la siguiente etapa
  } catch {
    respuesta.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
}