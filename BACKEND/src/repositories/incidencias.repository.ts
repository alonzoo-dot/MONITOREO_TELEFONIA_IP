import type { PoolClient } from 'pg';
import { consultarCon, ejecutarConsulta } from '../config/database';

/** Tipo de evento registrado en una incidencia. */
export type TipoEvento = 'CAIDA' | 'RECUPERACION';

/** Datos escribibles de una incidencia generada por el motor de monitoreo. */
export interface DatosIncidencia {
  id_telefono: number;
  tipo_evento: TipoEvento;
  ip_registrada: string | null;
  descripcion_falla?: string | null;
}

/** Cuenta las incidencias registradas para un teléfono. */
export async function contarPorTelefono(
  idTelefono: number,
  cliente?: PoolClient,
): Promise<number> {
  const resultado = await consultarCon<{ total: number }>(
    cliente,
    `SELECT COUNT(*)::int AS total FROM incidencias WHERE id_telefono = $1`,
    [idTelefono],
  );
  return resultado.rows[0]!.total;
}

/** Inserta una incidencia y devuelve su id generado. */
export async function insertarIncidencia(
  datos: DatosIncidencia,
  cliente?: PoolClient,
): Promise<number> {
  const resultado = await consultarCon<{ id_incidencia: number }>(
    cliente,
    `INSERT INTO incidencias (id_telefono, tipo_evento, ip_registrada, descripcion_falla)
     VALUES ($1, $2, $3, $4)
     RETURNING id_incidencia`,
    [datos.id_telefono, datos.tipo_evento, datos.ip_registrada, datos.descripcion_falla ?? null],
  );
  return resultado.rows[0]!.id_incidencia;
}

/** Cuenta las incidencias sin atender (sin usuario asignado). */
export async function contarPendientes(): Promise<number> {
  const resultado = await ejecutarConsulta<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM incidencias WHERE id_usuario_atendio IS NULL`,
  );
  return resultado.rows[0]!.total;
}
