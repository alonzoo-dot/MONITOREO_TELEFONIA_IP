import jwt from 'jsonwebtoken';
import { configuracion } from '../config/env';

/** Datos que guardamos dentro del token para identificar al usuario. */
export interface DatosToken {
  id_usuario: number;
  usuario: string;
  tipo_rol: string;
}

/** Genera un token firmado con los datos del usuario que inició sesión. */
export function generarToken(datos: DatosToken): string {
  return jwt.sign(datos, configuracion.jwtSecret, {
    expiresIn: configuracion.jwtExpiracion,
  });
}

/** Verifica que un token sea válido y devuelve los datos que contiene. */
export function verificarToken(token: string): DatosToken {
  return jwt.verify(token, configuracion.jwtSecret) as DatosToken;
}