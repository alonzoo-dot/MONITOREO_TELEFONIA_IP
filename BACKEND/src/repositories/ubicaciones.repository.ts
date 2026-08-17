import type { PoolClient } from 'pg';
import { consultarCon } from '../config/database';

/** Una ubicación tal como vive en la base de datos. */
export interface Ubicacion {
  id_ubicacion: number;
  nombre: string;
  piso: number;
  tipo_ubicacion: string;
}

/** Campos necesarios para crear una ubicación. */
export interface DatosUbicacion {
  nombre: string;
  piso: number;
  tipo_ubicacion: string;
}

/** Busca una ubicación por su nombre. Devuelve la ubicación o null si no existe. */
export async function buscarPorNombre(
  nombre: string,
  cliente?: PoolClient,
): Promise<Ubicacion | null> {
  const resultado = await consultarCon<Ubicacion>(
    cliente,
    `SELECT id_ubicacion, nombre, piso, tipo_ubicacion
       FROM ubicaciones
      WHERE nombre = $1`,
    [nombre],
  );
  return resultado.rows[0] ?? null;
}

/** Inserta una ubicación y devuelve su id generado. */
export async function crearUbicacion(
  datos: DatosUbicacion,
  cliente?: PoolClient,
): Promise<number> {
  const resultado = await consultarCon<{ id_ubicacion: number }>(
    cliente,
    `INSERT INTO ubicaciones (nombre, piso, tipo_ubicacion)
     VALUES ($1, $2, $3)
     RETURNING id_ubicacion`,
    [datos.nombre, datos.piso, datos.tipo_ubicacion],
  );
  return resultado.rows[0]!.id_ubicacion;
}