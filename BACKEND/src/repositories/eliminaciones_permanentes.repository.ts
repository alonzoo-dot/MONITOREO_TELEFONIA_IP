import type { PoolClient } from 'pg';
import { consultarCon } from '../config/database';

/** Datos escribibles de una entrada del log de auditoría de eliminaciones permanentes. */
export interface DatosEliminacion {
  extension_original: string;
  mac_original: string | null;
  tipo_original: 'IP_ATA' | 'IP_NATIVO' | 'ANALOGICO';
  ubicacion_original: string;
  cantidad_incidencias_borradas: number;
  cantidad_mantenimiento_log_borradas: number;
  id_usuario: number;
}

/** Inserta una entrada en el log de auditoría de eliminaciones permanentes. */
export async function registrarEliminacion(
  datos: DatosEliminacion,
  cliente?: PoolClient,
): Promise<void> {
  await consultarCon(
    cliente,
    `INSERT INTO eliminaciones_permanentes
       (extension_original, mac_original, tipo_original, ubicacion_original,
        cantidad_incidencias_borradas, cantidad_mantenimiento_log_borradas, id_usuario)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      datos.extension_original,
      datos.mac_original,
      datos.tipo_original,
      datos.ubicacion_original,
      datos.cantidad_incidencias_borradas,
      datos.cantidad_mantenimiento_log_borradas,
      datos.id_usuario,
    ],
  );
}

// Copia el nombre del usuario a nombre_usuario y libera la FK (la deja en NULL)
// en todas sus entradas de este log. Se usa al eliminar permanentemente un
// usuario, para preservar su nombre en la auditoria. Devuelve filas afectadas.
export async function denormalizarUsuario(
  idUsuario: number,
  nombreCompleto: string,
  cliente?: PoolClient,
): Promise<number> {
  const resultado = await consultarCon(
    cliente,
    `UPDATE eliminaciones_permanentes
        SET nombre_usuario = $1,
            id_usuario = NULL
      WHERE id_usuario = $2`,
    [nombreCompleto, idUsuario],
  );
  return resultado.rowCount ?? 0;
}
