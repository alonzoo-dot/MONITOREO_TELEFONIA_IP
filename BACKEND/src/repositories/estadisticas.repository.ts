import { ejecutarConsulta } from '../config/database'

// Tipos de fila crudos que devuelve el repositorio en snake_case
export interface PuntoTendencia { periodo: string; caidas: number }
export interface FilaTopDispositivo { id_telefono: number; extension: string; ubicacion: string; tipo_ubicacion: string; caidas: number }
export interface FilaConteo { clave: string; caidas: number }
export interface FilaTiempoAtencion { atendidas: number; promedio_minutos: number | null; mediana_minutos: number | null }
export interface FilaCargaUsuario { id_usuario: number; usuario: string; atendidas: number }
export interface FilaFotoActual { total: number; online: number; offline: number; mantenimiento: number; desconocido: number }

// Mapa fijo granularidad -> unidad de date_trunc. Evita interpolar texto libre en SQL
const UNIDAD_TRUNC: Record<string, string> = { dia: 'day', semana: 'week', mes: 'month' }

// Construye el filtro de rango sobre fecha_ocurrido de forma parametrizada
function filtroRango(desde: string | undefined, hasta: string | undefined, indiceInicial: number) {
  const condiciones: string[] = []
  const valores: unknown[] = []
  let i = indiceInicial
  if (desde) {
    condiciones.push(`i.fecha_ocurrido >= $${i}`)
    valores.push(desde)
    i += 1
  }
  if (hasta) {
    // hasta inclusivo hasta el final del dia
    condiciones.push(`i.fecha_ocurrido < ($${i}::date + interval '1 day')`)
    valores.push(hasta)
    i += 1
  }
  const sql = condiciones.length ? `AND ${condiciones.join(' AND ')}` : ''
  return { sql, valores, siguienteIndice: i }
}

// Tendencia de caidas por periodo con relleno de ceros
export async function obtenerTendencia(
  desde: string | undefined,
  hasta: string | undefined,
  granularidad: string
): Promise<PuntoTendencia[]> {
  const unidad = UNIDAD_TRUNC[granularidad] ?? 'day'
  const rango = filtroRango(desde, hasta, 1)
  const sql = `
    WITH limites AS (
      SELECT
        COALESCE($${rango.siguienteIndice}::date, MIN(i.fecha_ocurrido)::date) AS inicio,
        COALESCE($${rango.siguienteIndice + 1}::date, MAX(i.fecha_ocurrido)::date) AS fin
      FROM incidencias i
      WHERE i.tipo_evento = 'CAIDA'
    ),
    serie AS (
      SELECT generate_series(date_trunc('${unidad}', inicio), date_trunc('${unidad}', fin), interval '1 ${unidad}') AS periodo
      FROM limites
      WHERE inicio IS NOT NULL AND fin IS NOT NULL
    ),
    conteos AS (
      SELECT date_trunc('${unidad}', i.fecha_ocurrido) AS periodo, COUNT(*)::int AS caidas
      FROM incidencias i
      WHERE i.tipo_evento = 'CAIDA' ${rango.sql}
      GROUP BY 1
    )
    SELECT to_char(s.periodo, 'YYYY-MM-DD') AS periodo, COALESCE(c.caidas, 0) AS caidas
    FROM serie s
    LEFT JOIN conteos c ON c.periodo = s.periodo
    ORDER BY s.periodo
  `
  const valores = [...rango.valores, desde ?? null, hasta ?? null]
  const resultado = await ejecutarConsulta<{ periodo: string; caidas: number }>(sql, valores)
  return resultado.rows.map((r) => ({ periodo: r.periodo, caidas: Number(r.caidas) }))
}

// Top 10 dispositivos con mas caidas en el rango
export async function obtenerTopDispositivos(desde?: string, hasta?: string): Promise<FilaTopDispositivo[]> {
  const rango = filtroRango(desde, hasta, 1)
  const sql = `
    SELECT
      t.id_telefono AS id_telefono,
      t.extension AS extension,
      u.nombre AS ubicacion,
      u.tipo_ubicacion AS tipo_ubicacion,
      COUNT(*)::int AS caidas
    FROM incidencias i
    JOIN telefonos t ON t.id_telefono = i.id_telefono
    JOIN ubicaciones u ON u.id_ubicacion = t.id_ubicacion
    WHERE i.tipo_evento = 'CAIDA' ${rango.sql}
    GROUP BY t.id_telefono, t.extension, u.nombre, u.tipo_ubicacion
    ORDER BY caidas DESC, t.extension ASC
    LIMIT 10
  `
  const resultado = await ejecutarConsulta<FilaTopDispositivo>(sql, rango.valores)
  return resultado.rows
}

// Distribucion de caidas por piso
export async function obtenerDistribucionPiso(desde?: string, hasta?: string): Promise<FilaConteo[]> {
  const rango = filtroRango(desde, hasta, 1)
  const sql = `
    SELECT u.piso::text AS clave, COUNT(*)::int AS caidas
    FROM incidencias i
    JOIN telefonos t ON t.id_telefono = i.id_telefono
    JOIN ubicaciones u ON u.id_ubicacion = t.id_ubicacion
    WHERE i.tipo_evento = 'CAIDA' ${rango.sql}
    GROUP BY u.piso
    ORDER BY u.piso
  `
  const resultado = await ejecutarConsulta<FilaConteo>(sql, rango.valores)
  return resultado.rows
}

// Distribucion de caidas por modelo de ATA. Los IP nativos sin ATA se agrupan aparte
export async function obtenerDistribucionModelo(desde?: string, hasta?: string): Promise<FilaConteo[]> {
  const rango = filtroRango(desde, hasta, 1)
  const sql = `
    SELECT COALESCE(ma.modelo, 'IP nativo (sin ATA)') AS clave, COUNT(*)::int AS caidas
    FROM incidencias i
    JOIN telefonos t ON t.id_telefono = i.id_telefono
    LEFT JOIN atas a ON a.id_telefono = t.id_telefono
    LEFT JOIN modelos_ata ma ON ma.id_modelo_ata = a.id_modelo_ata
    WHERE i.tipo_evento = 'CAIDA' ${rango.sql}
    GROUP BY COALESCE(ma.modelo, 'IP nativo (sin ATA)')
    ORDER BY caidas DESC
  `
  const resultado = await ejecutarConsulta<FilaConteo>(sql, rango.valores)
  return resultado.rows
}

// Distribucion de caidas por tipo de ubicacion
export async function obtenerDistribucionTipoUbicacion(desde?: string, hasta?: string): Promise<FilaConteo[]> {
  const rango = filtroRango(desde, hasta, 1)
  const sql = `
    SELECT u.tipo_ubicacion AS clave, COUNT(*)::int AS caidas
    FROM incidencias i
    JOIN telefonos t ON t.id_telefono = i.id_telefono
    JOIN ubicaciones u ON u.id_ubicacion = t.id_ubicacion
    WHERE i.tipo_evento = 'CAIDA' ${rango.sql}
    GROUP BY u.tipo_ubicacion
    ORDER BY caidas DESC
  `
  const resultado = await ejecutarConsulta<FilaConteo>(sql, rango.valores)
  return resultado.rows
}

// Tiempo de atencion promedio y mediana en minutos sobre caidas atendidas
export async function obtenerTiempoAtencion(desde?: string, hasta?: string): Promise<FilaTiempoAtencion> {
  const rango = filtroRango(desde, hasta, 1)
  const sql = `
    SELECT
      COUNT(*)::int AS atendidas,
      AVG(EXTRACT(EPOCH FROM (i.fecha_atendida - i.fecha_ocurrido)) / 60) AS promedio_minutos,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (i.fecha_atendida - i.fecha_ocurrido)) / 60) AS mediana_minutos
    FROM incidencias i
    WHERE i.tipo_evento = 'CAIDA' AND i.fecha_atendida IS NOT NULL ${rango.sql}
  `
  const resultado = await ejecutarConsulta<{ atendidas: number; promedio_minutos: number | null; mediana_minutos: number | null }>(sql, rango.valores)
  const f = resultado.rows[0]
  return {
    atendidas: Number(f.atendidas),
    promedio_minutos: f.promedio_minutos === null ? null : Number(f.promedio_minutos),
    mediana_minutos: f.mediana_minutos === null ? null : Number(f.mediana_minutos)
  }
}

// Carga por usuario: caidas atendidas por cada usuario en el rango
export async function obtenerCargaUsuarios(desde?: string, hasta?: string): Promise<FilaCargaUsuario[]> {
  const rango = filtroRango(desde, hasta, 1)
  const sql = `
    SELECT
      us.id_usuario AS id_usuario,
      us.nombre_completo AS usuario,
      COUNT(*)::int AS atendidas
    FROM incidencias i
    JOIN usuarios us ON us.id_usuario = i.id_usuario_atendio
    WHERE i.tipo_evento = 'CAIDA' AND i.id_usuario_atendio IS NOT NULL ${rango.sql}
    GROUP BY us.id_usuario, us.nombre_completo
    ORDER BY atendidas DESC
  `
  const resultado = await ejecutarConsulta<FilaCargaUsuario>(sql, rango.valores)
  return resultado.rows
}

// Foto actual del estado de la red. Excluye dispositivos dados de baja logica (activo = false)
export async function obtenerFotoActual(): Promise<FilaFotoActual> {
  const sql = `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE m.estado = 'ONLINE')::int AS online,
      COUNT(*) FILTER (WHERE m.estado = 'OFFLINE')::int AS offline,
      COUNT(*) FILTER (WHERE m.estado = 'EN_MANTENIMIENTO')::int AS mantenimiento,
      COUNT(*) FILTER (WHERE m.estado = 'DESCONOCIDO')::int AS desconocido
    FROM monitoreo m
    JOIN telefonos t ON t.id_telefono = m.id_telefono
    WHERE t.activo = true
  `
  const resultado = await ejecutarConsulta<FilaFotoActual>(sql)
  return resultado.rows[0]
}
