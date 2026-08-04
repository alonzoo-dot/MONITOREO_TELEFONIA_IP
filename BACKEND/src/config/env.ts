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
} as const;