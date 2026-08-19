import type { PoolClient } from 'pg';
import { consultarCon, ejecutarConsulta } from '../config/database';

/** Estados posibles de un dispositivo monitoreado. */
export type EstadoMonitoreo = 'ONLINE' | 'OFFLINE' | 'DESCONOCIDO' | 'EN_MANTENIMIENTO';

/** Un dispositivo apto para ser pingueado por el motor de monitoreo. */
export interface DispositivoMonitoreable {
  id_telefono: number;
  tipo: 'IP_ATA' | 'IP_NATIVO';
  ip: string;
  mac: string | null;
  estado: EstadoMonitoreo;
}

/**
 * Lista los dispositivos activos con IP conocida (IP_ATA o IP_NATIVO), junto con
 * su estado actual de monitoreo (DESCONOCIDO si aún no tienen fila en `monitoreo`).
 */
export async function listarDispositivosMonitoreables(): Promise<DispositivoMonitoreable[]> {
  const resultado = await ejecutarConsulta<DispositivoMonitoreable>(
    `SELECT
       t.id_telefono,
       t.tipo,
       COALESCE(a.ip, t.ip)::text AS ip,
       COALESCE(a.mac, t.mac)::text AS mac,
       COALESCE(m.estado, 'DESCONOCIDO') AS estado
     FROM telefonos t
     LEFT JOIN atas a       ON a.id_telefono = t.id_telefono
     LEFT JOIN monitoreo m  ON m.id_telefono = t.id_telefono
     WHERE t.activo = true
       AND t.tipo IN ('IP_ATA', 'IP_NATIVO')
       AND COALESCE(a.ip, t.ip) IS NOT NULL`,
  );
  return resultado.rows;
}

/** Crea la fila de monitoreo de un teléfono, en estado DESCONOCIDO. Idempotente. */
export async function crearFilaMonitoreo(
  idTelefono: number,
  cliente?: PoolClient,
): Promise<void> {
  await consultarCon(
    cliente,
    `INSERT INTO monitoreo (id_telefono)
     VALUES ($1)
     ON CONFLICT (id_telefono) DO NOTHING`,
    [idTelefono],
  );
}

/** Actualiza el estado de monitoreo de un teléfono. */
export async function actualizarEstado(
  idTelefono: number,
  estado: EstadoMonitoreo,
  fechaUltimaConexion: Date | null,
  cliente?: PoolClient,
): Promise<void> {
  await consultarCon(
    cliente,
    `UPDATE monitoreo
        SET estado = $1,
            fecha_ultimo_cambio = now(),
            fecha_ultima_conexion = $2
      WHERE id_telefono = $3`,
    [estado, fechaUltimaConexion, idTelefono],
  );
}

/** Escribe la nueva IP de un dispositivo en la tabla que le corresponde según su tipo. */
export async function actualizarIpDispositivo(
  idTelefono: number,
  tipo: 'IP_ATA' | 'IP_NATIVO',
  nuevaIp: string,
  cliente?: PoolClient,
): Promise<void> {
  if (tipo === 'IP_ATA') {
    await consultarCon(cliente, `UPDATE atas SET ip = $1 WHERE id_telefono = $2`, [
      nuevaIp,
      idTelefono,
    ]);
  } else {
    await consultarCon(cliente, `UPDATE telefonos SET ip = $1 WHERE id_telefono = $2`, [
      nuevaIp,
      idTelefono,
    ]);
  }
}
