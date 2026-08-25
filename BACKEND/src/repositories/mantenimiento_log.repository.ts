import type { PoolClient } from 'pg';
import { consultarCon } from '../config/database';

/** Acciones registradas en el log de auditoría de mantenimiento. */
export type AccionMantenimiento = 'ACTIVAR' | 'DESACTIVAR';

/** Datos escribibles de una entrada del log de mantenimiento. */
export interface DatosLogMantenimiento {
  id_telefono: number;
  id_usuario: number;
  accion: AccionMantenimiento;
}

/** Inserta una entrada en el log de auditoría de mantenimiento. */
export async function insertarLog(
  datos: DatosLogMantenimiento,
  cliente?: PoolClient,
): Promise<void> {
  await consultarCon(
    cliente,
    `INSERT INTO mantenimiento_log (id_telefono, id_usuario, accion)
     VALUES ($1, $2, $3)`,
    [datos.id_telefono, datos.id_usuario, datos.accion],
  );
}
