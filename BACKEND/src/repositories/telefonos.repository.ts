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
  ip: string | null; // la escribe el monitoreo; null en este módulo
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
  ata_ip: string | null;
  ata_numero_serie: string | null;
  ata_activo: boolean | null;
  mac_efectiva: string | null; // COALESCE(atas.mac, telefonos.mac)
}

/** Filtros opcionales para el listado de dispositivos. */
export interface FiltrosDispositivo {
  tipo?: string;
  piso?: number;
  id_modelo_telefono?: number;
  activo?: boolean;
  busqueda?: string; // coincide contra nombre de ubicación o MAC efectiva
}

/** Campos escribibles de un teléfono, compartidos por el alta y la edición. */
export interface DatosTelefono {
  id_ubicacion: number;
  id_modelo_telefono: number;
  extension: string;
  tipo: string;
  numero_serie: string | null;
  mac: string | null;
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
         COALESCE(a.mac, t.mac) AS mac_efectiva
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

/** Inserta un teléfono y devuelve su id generado. */
export async function crearTelefono(
  datos: DatosTelefono,
  cliente?: PoolClient,
): Promise<number> {
  const resultado = await consultarCon<{ id_telefono: number }>(
    cliente,
    `INSERT INTO telefonos
       (id_ubicacion, id_modelo_telefono, extension, tipo, numero_serie, mac)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id_telefono`,
    [
      datos.id_ubicacion,
      datos.id_modelo_telefono,
      datos.extension,
      datos.tipo,
      datos.numero_serie,
      datos.mac,
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
            mac = $6
      WHERE id_telefono = $7`,
    [
      datos.id_ubicacion,
      datos.id_modelo_telefono,
      datos.extension,
      datos.tipo,
      datos.numero_serie,
      datos.mac,
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
