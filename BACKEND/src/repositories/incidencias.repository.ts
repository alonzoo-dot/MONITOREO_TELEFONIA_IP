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

/** Cuenta las incidencias pendientes: caídas sin atender. */
export async function contarPendientes(): Promise<number> {
  const resultado = await ejecutarConsulta<{ total: number }>(
    `SELECT COUNT(*)::int AS total
       FROM incidencias
      WHERE tipo_evento = 'CAIDA' AND id_usuario_atendio IS NULL`,
  );
  return resultado.rows[0]!.total;
}

/** Elimina todas las incidencias de un teléfono. Devuelve la cantidad de filas borradas. */
export async function eliminarPorTelefono(
  idTelefono: number,
  cliente?: PoolClient,
): Promise<number> {
  const resultado = await consultarCon(
    cliente,
    `DELETE FROM incidencias WHERE id_telefono = $1 RETURNING id_incidencia`,
    [idTelefono],
  );
  return resultado.rowCount ?? 0;
}

// Una fila del historial ya enriquecida con datos legibles para la tabla.
export interface IncidenciaDetalle {
  id_incidencia: number;
  tipo_evento: string;
  fecha_ocurrido: Date;
  extension: string;
  ubicacion_nombre: string;
  piso: number;
  mac: string | null;
  ip_registrada: string | null;
  id_usuario_atendio: number | null;
  usuario_atendio: string | null;
  fecha_atendida: Date | null;
  descripcion_falla: string | null;
  pendiente: boolean;
}

// Filtros opcionales del listado de incidencias.
export interface FiltrosIncidencias {
  desde?: Date;
  hasta?: Date;
  tipo?: string;
  piso?: number;
  busqueda?: string;
  soloPendientes?: boolean;
}

// SELECT base del historial enriquecido. host() quita la mascara /32 de la inet.
// COALESCE(a.mac, t.mac) resuelve la MAC segun el tipo de dispositivo.
const SELECT_INCIDENCIA = `
  SELECT i.id_incidencia,
         i.tipo_evento,
         i.fecha_ocurrido,
         t.extension,
         u.nombre                 AS ubicacion_nombre,
         u.piso,
         COALESCE(a.mac, t.mac)   AS mac,
         host(i.ip_registrada)    AS ip_registrada,
         i.id_usuario_atendio,
         us.nombre_completo       AS usuario_atendio,
         i.fecha_atendida,
         i.descripcion_falla,
         (i.tipo_evento = 'CAIDA' AND i.id_usuario_atendio IS NULL) AS pendiente
    FROM incidencias i
    JOIN telefonos t     ON t.id_telefono = i.id_telefono
    JOIN ubicaciones u   ON u.id_ubicacion = t.id_ubicacion
    LEFT JOIN atas a     ON a.id_telefono = t.id_telefono
    LEFT JOIN usuarios us ON us.id_usuario = i.id_usuario_atendio`;

// Construye la clausula WHERE parametrizada a partir de los filtros.
// Devuelve el fragmento SQL y el arreglo de parametros en orden.
function construirFiltro(filtros: FiltrosIncidencias): {
  clausula: string;
  parametros: unknown[];
} {
  const condiciones: string[] = [];
  const parametros: unknown[] = [];

  if (filtros.desde !== undefined) {
    parametros.push(filtros.desde);
    condiciones.push(`i.fecha_ocurrido >= $${parametros.length}`);
  }
  if (filtros.hasta !== undefined) {
    parametros.push(filtros.hasta);
    condiciones.push(`i.fecha_ocurrido <= $${parametros.length}`);
  }
  if (filtros.tipo !== undefined) {
    parametros.push(filtros.tipo);
    condiciones.push(`i.tipo_evento = $${parametros.length}`);
  }
  if (filtros.piso !== undefined) {
    parametros.push(filtros.piso);
    condiciones.push(`u.piso = $${parametros.length}`);
  }
  if (filtros.busqueda !== undefined && filtros.busqueda.trim() !== '') {
    parametros.push(`%${filtros.busqueda.trim()}%`);
    const indice = parametros.length;
    condiciones.push(`(u.nombre ILIKE $${indice} OR COALESCE(a.mac, t.mac) ILIKE $${indice})`);
  }
  if (filtros.soloPendientes) {
    condiciones.push(`i.tipo_evento = 'CAIDA' AND i.id_usuario_atendio IS NULL`);
  }

  const clausula = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  return { clausula, parametros };
}

// Cuenta cuantas incidencias cumplen los filtros. Alimenta el total de la paginacion.
export async function contarIncidencias(filtros: FiltrosIncidencias): Promise<number> {
  const { clausula, parametros } = construirFiltro(filtros);
  const resultado = await ejecutarConsulta<{ total: number }>(
    `SELECT COUNT(*)::int AS total
       FROM incidencias i
       JOIN telefonos t   ON t.id_telefono = i.id_telefono
       JOIN ubicaciones u ON u.id_ubicacion = t.id_ubicacion
       LEFT JOIN atas a   ON a.id_telefono = t.id_telefono
       ${clausula}`,
    parametros,
  );
  return resultado.rows[0]!.total;
}

// Lista las incidencias que cumplen los filtros, ordenadas de mas reciente a mas antigua,
// con paginacion por offset.
export async function listarIncidencias(
  filtros: FiltrosIncidencias,
  limite: number,
  offset: number,
): Promise<IncidenciaDetalle[]> {
  const { clausula, parametros } = construirFiltro(filtros);
  const indiceLimite = parametros.length + 1;
  const indiceOffset = parametros.length + 2;
  const resultado = await ejecutarConsulta<IncidenciaDetalle>(
    `${SELECT_INCIDENCIA}
     ${clausula}
     ORDER BY i.fecha_ocurrido DESC
     LIMIT $${indiceLimite} OFFSET $${indiceOffset}`,
    [...parametros, limite, offset],
  );
  return resultado.rows;
}

// Marca una caida como atendida de forma atomica.
// El WHERE exige que siga siendo CAIDA y sin atender asi dos usuarios no se pisan.
// Devuelve la cantidad de filas afectadas: 1 si atendio, 0 si no cumplia la condicion.
export async function atenderIncidencia(
  idIncidencia: number,
  idUsuario: number,
  descripcionFalla: string | null,
  cliente?: PoolClient,
): Promise<number> {
  const resultado = await consultarCon(
    cliente,
    `UPDATE incidencias
        SET id_usuario_atendio = $1,
            fecha_atendida = now(),
            descripcion_falla = $2
      WHERE id_incidencia = $3
        AND tipo_evento = 'CAIDA'
        AND id_usuario_atendio IS NULL`,
    [idUsuario, descripcionFalla, idIncidencia],
  );
  return resultado.rowCount ?? 0;
}

// Busca una incidencia por su id. Devuelve el tipo y si ya fue atendida o null si no existe.
export async function buscarPorId(
  idIncidencia: number,
  cliente?: PoolClient,
): Promise<{ tipo_evento: string; id_usuario_atendio: number | null } | null> {
  const resultado = await consultarCon<{ tipo_evento: string; id_usuario_atendio: number | null }>(
    cliente,
    `SELECT tipo_evento, id_usuario_atendio FROM incidencias WHERE id_incidencia = $1`,
    [idIncidencia],
  );
  return resultado.rows[0] ?? null;
}

// Devuelve una sola incidencia enriquecida por su id o null si no existe.
export async function buscarDetallePorId(
  idIncidencia: number,
  cliente?: PoolClient,
): Promise<IncidenciaDetalle | null> {
  const resultado = await consultarCon<IncidenciaDetalle>(
    cliente,
    `${SELECT_INCIDENCIA}
     WHERE i.id_incidencia = $1`,
    [idIncidencia],
  );
  return resultado.rows[0] ?? null;
}