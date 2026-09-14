import { ejecutarConsulta } from '../config/database';

/** Dispositivo con lo minimo necesario para decidir y ejecutar una llamada. */
export interface DispositivoLlamada {
  id_telefono: number;
  extension: string;
  tipo: string;
  ip_efectiva: string | null; // host(COALESCE(atas.ip, telefonos.ip)), sin mascara de red
}

/** Dispositivo para el panel de llamadas, con datos descriptivos del listado. */
export interface DispositivoMarcable {
  id_telefono: number;
  extension: string;
  tipo: string;
  ip_efectiva: string | null;
  ubicacion: string;
}

/** Busca un dispositivo activo por id, con su IP efectiva, para operar una llamada. */
export async function buscarDispositivoParaLlamada(
  idTelefono: number,
): Promise<DispositivoLlamada | null> {
  const resultado = await ejecutarConsulta<DispositivoLlamada>(
    `SELECT t.id_telefono,
            t.extension,
            t.tipo,
            host(COALESCE(a.ip, t.ip)) AS ip_efectiva
       FROM telefonos t
       LEFT JOIN atas a ON a.id_telefono = t.id_telefono
      WHERE t.id_telefono = $1
        AND t.activo = true`,
    [idTelefono],
  );
  return resultado.rows[0] ?? null;
}

/**
 * Lista los dispositivos activos para el panel de llamadas, con todos los tipos.
 * El calculo de que accion admite cada tipo lo hace el servicio, no el repositorio.
 */
export async function listarDispositivosMarcables(): Promise<DispositivoMarcable[]> {
  const resultado = await ejecutarConsulta<DispositivoMarcable>(
    `SELECT t.id_telefono,
            t.extension,
            t.tipo,
            host(COALESCE(a.ip, t.ip)) AS ip_efectiva,
            u.nombre AS ubicacion
       FROM telefonos t
       JOIN ubicaciones u ON u.id_ubicacion = t.id_ubicacion
       LEFT JOIN atas a   ON a.id_telefono = t.id_telefono
      WHERE t.activo = true
      ORDER BY u.piso ASC, u.nombre ASC, t.extension ASC`,
  );
  return resultado.rows;
}
