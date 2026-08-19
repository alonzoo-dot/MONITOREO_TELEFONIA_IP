
import dotenv from 'dotenv';

dotenv.config();

function variableObligatoria(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno obligatoria: ${nombre}`);
  }
  return valor;
}

export const configuracion = {
  urlBaseDatos: variableObligatoria('DATABASE_URL'),
  puerto: Number(process.env.PORT ?? 4000),
  entorno: process.env.NODE_ENV ?? 'development',
  jwtSecret: variableObligatoria('JWT_SECRET'),
  jwtExpiracion: process.env.JWT_EXPIRES_IN ?? '12h',
  /** Si es true, el motor de monitoreo ICMP arranca al levantar el backend. */
  motorActivo: process.env.MOTOR_ACTIVO === 'true',
} as const;

