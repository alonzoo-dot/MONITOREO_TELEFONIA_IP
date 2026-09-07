import {
  obtenerTendencia as repoTendencia,
  obtenerTopDispositivos,
  obtenerDistribucionPiso,
  obtenerDistribucionModelo,
  obtenerDistribucionTipoUbicacion,
  obtenerTiempoAtencion,
  obtenerCargaUsuarios,
  obtenerFotoActual as repoFotoActual
} from '../repositories/estadisticas.repository'

// Tipos del contrato de respuesta en camelCase
export interface PuntoTendencia { periodo: string; caidas: number }
export interface RespuestaTendencia {
  granularidad: string
  desde: string | null
  hasta: string | null
  puntos: PuntoTendencia[]
}

export interface TopDispositivo { idTelefono: number; extension: string; ubicacion: string; tipoUbicacion: string; caidas: number }
export interface ConteoPiso { piso: string; caidas: number }
export interface ConteoModelo { modelo: string; caidas: number }
export interface ConteoTipoUbicacion { tipoUbicacion: string; caidas: number }
export interface TiempoAtencion { atendidas: number; promedioMinutos: number | null; medianaMinutos: number | null }
export interface CargaUsuario { idUsuario: number; usuario: string; atendidas: number }

export interface RespuestaResumen {
  desde: string | null
  hasta: string | null
  topDispositivos: TopDispositivo[]
  distribucionPiso: ConteoPiso[]
  distribucionModelo: ConteoModelo[]
  distribucionTipoUbicacion: ConteoTipoUbicacion[]
  tiempoAtencion: TiempoAtencion
  cargaUsuarios: CargaUsuario[]
}

export interface RespuestaFotoActual {
  generadoEn: string
  total: number
  online: number
  offline: number
  mantenimiento: number
  desconocido: number
}

// Redondea a la cantidad de decimales indicada conservando null
function redondear(valor: number | null, decimales: number): number | null {
  if (valor === null) return null
  const factor = 10 ** decimales
  return Math.round(valor * factor) / factor
}

// Serie temporal de caidas con granularidad
export async function generarTendencia(
  desde: string | undefined,
  hasta: string | undefined,
  granularidad: string
): Promise<RespuestaTendencia> {
  const puntos = await repoTendencia(desde, hasta, granularidad)
  return {
    granularidad,
    desde: desde ?? null,
    hasta: hasta ?? null,
    puntos
  }
}

// Resumen completo del rango. Consultas en paralelo
export async function generarResumen(desde?: string, hasta?: string): Promise<RespuestaResumen> {
  const [top, piso, modelo, tipoUbicacion, tiempo, carga] = await Promise.all([
    obtenerTopDispositivos(desde, hasta),
    obtenerDistribucionPiso(desde, hasta),
    obtenerDistribucionModelo(desde, hasta),
    obtenerDistribucionTipoUbicacion(desde, hasta),
    obtenerTiempoAtencion(desde, hasta),
    obtenerCargaUsuarios(desde, hasta)
  ])

  return {
    desde: desde ?? null,
    hasta: hasta ?? null,
    topDispositivos: top.map((f) => ({
      idTelefono: f.id_telefono,
      extension: f.extension,
      ubicacion: f.ubicacion,
      tipoUbicacion: f.tipo_ubicacion,
      caidas: f.caidas
    })),
    distribucionPiso: piso.map((f) => ({ piso: f.clave, caidas: f.caidas })),
    distribucionModelo: modelo.map((f) => ({ modelo: f.clave, caidas: f.caidas })),
    distribucionTipoUbicacion: tipoUbicacion.map((f) => ({ tipoUbicacion: f.clave, caidas: f.caidas })),
    tiempoAtencion: {
      atendidas: tiempo.atendidas,
      promedioMinutos: redondear(tiempo.promedio_minutos, 1),
      medianaMinutos: redondear(tiempo.mediana_minutos, 1)
    },
    cargaUsuarios: carga.map((f) => ({ idUsuario: f.id_usuario, usuario: f.usuario, atendidas: f.atendidas }))
  }
}

// Foto actual del estado de la red
export async function generarFotoActual(): Promise<RespuestaFotoActual> {
  const foto = await repoFotoActual()
  return {
    generadoEn: new Date().toISOString(),
    total: foto.total,
    online: foto.online,
    offline: foto.offline,
    mantenimiento: foto.mantenimiento,
    desconocido: foto.desconocido
  }
}
