import type { PoolClient } from 'pg';
import { consultarCon, ejecutarConsulta } from '../config/database';

/**
 * Un dispositivo tal como se lee de la base de datos: el teléfono enriquecido
 * con su ubicación, su modelo y —si lo tiene— los datos de su ATA.
 * Los campos del ATA son null cuando el dispositivo no es IP_ATA.
 */
export interface DispositivoDetalle {
  id_telefono: number;
  extension: string;
  tipo: string;
  numero_serie: string | null;
  mac: string | null; // MAC propia del teléfono (solo IP_NATIVO)
  ip: string | null; // IP propia del teléfono (solo IP_NATIVO)
  activo: boolean;
  id_ubicacion: number;
  ubicacion_nombre: string;
  piso: number;
  tipo_ubicacion: string;
  id_modelo_telefono: number;
  modelo_telefono: string;
  marca_telefono: string;
  id_ata: number | null;
  id_modelo_ata: number | null;
  modelo_ata: string | null;
  marca_ata: string | null;
  ata_mac: string | null;
  ata_ip: string | null; // IP propia del ATA (solo IP_ATA)
  ata_numero_serie: string | null;
  ata_activo: boolean | null;
  mac_efectiva: string | null; // COALESCE(atas.mac, telefonos.mac)
  ip_efectiva: string | null; // COALESCE(atas.ip, telefonos.ip)
}

/** Filtros opcionales para el listado de dispositivos. */
export interface FiltrosDispositivo {
  tipo?: string;
  piso?: number;
  id_modelo_telefono?: number;
  activo?: boolean;
  busqueda?: string; // coincide contra nombre de ubicación o MAC efectiva
  /** Si es true, incluye también los dispositivos inactivos. Ignorado si `activo` viene definido. */
  incluir_inactivos?: boolean;
}

/** Campos escribibles de un teléfono, compartidos por el alta y la edición. */
export interface DatosTelefono {
  id_ubicacion: number;
  id_modelo_telefono: number;
  extension: string;
  tipo: string;
  numero_serie: string | null;
  mac: string | null;
  ip: string | null;
}

/** SELECT base del dispositivo enriquecido, reutilizado por listado y detalle. */
const SELECT_DISPOSITIVO = `
  SELECT t.id_telefono,
         t.extension,
         t.tipo,
         t.numero_serie,
         t.mac,
         t.ip,
         t.activo,
         u.id_ubicacion,
         u.nombre        AS ubicacion_nombre,
         u.piso,
         u.tipo_ubicacion,
         mt.id_modelo_telefono,
         mt.modelo       AS modelo_telefono,
         mt.marca        AS marca_telefono,
         a.id_ata,
         a.id_modelo_ata,
         ma.modelo       AS modelo_ata,
         ma.marca        AS marca_ata,
         a.mac           AS ata_mac,
         a.ip            AS ata_ip,
         a.numero_serie  AS ata_numero_serie,
         a.activo        AS ata_activo,
         COALESCE(a.mac, t.mac) AS mac_efectiva,
         COALESCE(a.ip, t.ip) AS ip_efectiva
    FROM telefonos t
    JOIN ubicaciones u        ON u.id_ubicacion = t.id_ubicacion
    JOIN modelos_telefono mt  ON mt.id_modelo_telefono = t.id_modelo_telefono
    LEFT JOIN atas a          ON a.id_telefono = t.id_telefono
    LEFT JOIN modelos_ata ma  ON ma.id_modelo_ata = a.id_modelo_ata`;

/** Lista los dispositivos que cumplan los filtros dados (todos opcionales). */
export async function listarDispositivos(
  filtros: FiltrosDispositivo,
): Promise<DispositivoDetalle[]> {
  const condiciones: string[] = [];
  const parametros: unknown[] = [];

  if (filtros.tipo !== undefined) {
    parametros.push(filtros.tipo);
    condiciones.push(`t.tipo = $${parametros.length}`);
  }
  if (filtros.piso !== undefined) {
    parametros.push(filtros.piso);
    condiciones.push(`u.piso = $${parametros.length}`);
  }
  if (filtros.id_modelo_telefono !== undefined) {
    parametros.push(filtros.id_modelo_telefono);
    condiciones.push(`t.id_modelo_telefono = $${parametros.length}`);
  }
  if (filtros.activo !== undefined) {
    parametros.push(filtros.activo);
    condiciones.push(`t.activo = $${parametros.length}`);
  } else if (!filtros.incluir_inactivos) {
    condiciones.push(`t.activo = true`);
  }
  if (filtros.busqueda !== undefined && filtros.busqueda.trim() !== '') {
    parametros.push(`%${filtros.busqueda.trim()}%`);
    const indice = parametros.length;
    condiciones.push(
      `(u.nombre ILIKE $${indice} OR COALESCE(a.mac, t.mac)::text ILIKE $${indice})`,
    );
  }

  const filtro = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

  const resultado = await ejecutarConsulta<DispositivoDetalle>(
    `${SELECT_DISPOSITIVO}
     ${filtro}
     ORDER BY u.piso ASC, u.nombre ASC, t.extension ASC`,
    parametros,
  );
  return resultado.rows;
}

/** Obtiene un dispositivo enriquecido por su id. Devuelve el dispositivo o null. */
export async function buscarDetallePorId(
  idTelefono: number,
): Promise<DispositivoDetalle | null> {
  const resultado = await ejecutarConsulta<DispositivoDetalle>(
    `${SELECT_DISPOSITIVO}
     WHERE t.id_telefono = $1`,
    [idTelefono],
  );
  return resultado.rows[0] ?? null;
}

/**
 * Un dispositivo con todos sus datos de inventario más los datos derivados de
 * monitoreo (estado actual, última conexión, total de incidencias), para la
 * vista de solo lectura "Ver detalle". Nombrado distinto de `DispositivoDetalle`
 * (la vista enriquecida de listado/edición) para no chocar con ella.
 */
export interface DetalleDispositivo {
  id_telefono: number;
  ubicacion_nombre: string;
  tipo_ubicacion: string;
  piso: number;
  extension: string;
  tipo: 'IP_ATA' | 'IP_NATIVO' | 'ANALOGICO';
  modelo_telefono: string;
  marca_telefono: string;
  numero_serie: string;
  mac: string | null;
  ip: string | null;
  modelo_ata: string | null;
  marca_ata: string | null;
  cantidad_puertos: number | null;
  ata_numero_serie: string | null;
  activo: boolean;
  // Derivados de monitoreo: null (o 0 para el conteo) si el dispositivo no es monitoreable
  // o todavía no tiene fila en `monitoreo`.
  estado_monitoreo: 'ONLINE' | 'OFFLINE' | 'DESCONOCIDO' | 'EN_MANTENIMIENTO' | null;
  fecha_ultima_conexion: Date | null;
  total_incidencias: number;
  total_mantenimiento_log: number;
}

/** Obtiene el detalle completo (inventario + derivados de monitoreo) de un dispositivo. */
export async function obtenerDetalle(idTelefono: number): Promise<DetalleDispositivo | null> {
  const resultado = await ejecutarConsulta<DetalleDispositivo>(
    `SELECT t.id_telefono,
            u.nombre        AS ubicacion_nombre,
            u.tipo_ubicacion,
            u.piso,
            t.extension,
            t.tipo,
            mt.modelo       AS modelo_telefono,
            mt.marca        AS marca_telefono,
            t.numero_serie,
            COALESCE(a.mac, t.mac)::text AS mac,
            host(COALESCE(a.ip, t.ip))   AS ip,
            ma.modelo       AS modelo_ata,
            ma.marca        AS marca_ata,
            ma.cantidad_puertos,
            a.numero_serie  AS ata_numero_serie,
            t.activo,
            m.estado        AS estado_monitoreo,
            m.fecha_ultima_conexion,
            COALESCE(inc.total, 0)::int AS total_incidencias,
            COALESCE(mlog.total, 0)::int AS total_mantenimiento_log
       FROM telefonos t
       JOIN ubicaciones u        ON u.id_ubicacion = t.id_ubicacion
       JOIN modelos_telefono mt  ON mt.id_modelo_telefono = t.id_modelo_telefono
       LEFT JOIN atas a          ON a.id_telefono = t.id_telefono
       LEFT JOIN modelos_ata ma  ON ma.id_modelo_ata = a.id_modelo_ata
       LEFT JOIN monitoreo m     ON m.id_telefono = t.id_telefono
       LEFT JOIN (
         SELECT id_telefono, COUNT(*) AS total
           FROM incidencias
          GROUP BY id_telefono
       ) inc ON inc.id_telefono = t.id_telefono
       LEFT JOIN (
         SELECT id_telefono, COUNT(*) AS total
           FROM mantenimiento_log
          GROUP BY id_telefono
       ) mlog ON mlog.id_telefono = t.id_telefono
      WHERE t.id_telefono = $1`,
    [idTelefono],
  );
  return resultado.rows[0] ?? null;
}

/** Devuelve el id del teléfono que usa esa extensión, o null si está libre. */
export async function buscarIdPorExtension(
  extension: string,
  cliente?: PoolClient,
): Promise<number | null> {
  const resultado = await consultarCon<{ id_telefono: number }>(
    cliente,
    `SELECT id_telefono FROM telefonos WHERE extension = $1`,
    [extension],
  );
  const fila = resultado.rows[0] ?? null;
  return fila ? fila.id_telefono : null;
}

/** Devuelve el id del teléfono que usa esa MAC en la tabla telefonos, o null. */
export async function buscarIdPorMac(
  mac: string,
  cliente?: PoolClient,
): Promise<number | null> {
  const resultado = await consultarCon<{ id_telefono: number }>(
    cliente,
    `SELECT id_telefono FROM telefonos WHERE mac = $1`,
    [mac],
  );
  const fila = resultado.rows[0] ?? null;
  return fila ? fila.id_telefono : null;
}

/** Datos de contexto del dispositivo dueño de una IP, para mensajes al usuario. */
export interface DispositivoConIp {
  id_telefono: number;
  extension: string;
  ubicacion_nombre: string;
  tipo_ubicacion: string;
}

/**
 * Devuelve el dispositivo que actualmente tiene la IP dada (con su extensión y
 * ubicación, para mensajes de error legibles), o null si nadie la tiene. Busca
 * en telefonos.ip y atas.ip. Ignora el id_telefono pasado en `excluirId` (útil
 * para actualizaciones donde el propio dispositivo mantiene su IP).
 */
export async function buscarPorIp(
  ip: string,
  excluirId: number | null,
  cliente?: PoolClient,
): Promise<DispositivoConIp | null> {
  const resultado = await consultarCon<DispositivoConIp>(
    cliente,
    `SELECT t.id_telefono, t.extension, u.nombre AS ubicacion_nombre, u.tipo_ubicacion
       FROM telefonos t
       JOIN ubicaciones u ON u.id_ubicacion = t.id_ubicacion
       LEFT JOIN atas a ON a.id_telefono = t.id_telefono
      WHERE (host(t.ip) = $1 OR host(a.ip) = $1)
        AND ($2::int IS NULL OR t.id_telefono <> $2)
      LIMIT 1`,
    [ip, excluirId],
  );
  return resultado.rows[0] ?? null;
}

/** Inserta un teléfono y devuelve su id generado. */
export async function crearTelefono(
  datos: DatosTelefono,
  cliente?: PoolClient,
): Promise<number> {
  const resultado = await consultarCon<{ id_telefono: number }>(
    cliente,
    `INSERT INTO telefonos
       (id_ubicacion, id_modelo_telefono, extension, tipo, numero_serie, mac, ip)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id_telefono`,
    [
      datos.id_ubicacion,
      datos.id_modelo_telefono,
      datos.extension,
      datos.tipo,
      datos.numero_serie,
      datos.mac,
      datos.ip,
    ],
  );
  return resultado.rows[0]!.id_telefono;
}

/** Actualiza los datos de un teléfono existente. */
export async function actualizarTelefono(
  idTelefono: number,
  datos: DatosTelefono,
  cliente?: PoolClient,
): Promise<void> {
  await consultarCon(
    cliente,
    `UPDATE telefonos
        SET id_ubicacion = $1,
            id_modelo_telefono = $2,
            extension = $3,
            tipo = $4,
            numero_serie = $5,
            mac = $6,
            ip = $7
      WHERE id_telefono = $8`,
    [
      datos.id_ubicacion,
      datos.id_modelo_telefono,
      datos.extension,
      datos.tipo,
      datos.numero_serie,
      datos.mac,
      datos.ip,
      idTelefono,
    ],
  );
}

/** Baja lógica: marca el teléfono como inactivo. */
export async function desactivarTelefono(
  idTelefono: number,
  cliente?: PoolClient,
): Promise<void> {
  await consultarCon(
    cliente,
    `UPDATE telefonos SET activo = false WHERE id_telefono = $1`,
    [idTelefono],
  );
}

/** Reactiva un teléfono dado de baja. */
export async function reactivarTelefono(
  idTelefono: number,
  cliente?: PoolClient,
): Promise<void> {
  await consultarCon(
    cliente,
    `UPDATE telefonos SET activo = true WHERE id_telefono = $1`,
    [idTelefono],
  );
}

/** Borrado físico de un teléfono. */
export async function eliminarTelefono(
  idTelefono: number,
  cliente?: PoolClient,
): Promise<void> {
  await consultarCon(cliente, `DELETE FROM telefonos WHERE id_telefono = $1`, [idTelefono]);
}
