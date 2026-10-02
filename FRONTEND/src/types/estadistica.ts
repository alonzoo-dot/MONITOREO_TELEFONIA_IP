// Granularidad temporal del grafico de tendencia
export type Granularidad = 'dia' | 'semana' | 'mes'

// Un punto de la serie temporal de caidas
export interface PuntoTendencia {
  periodo: string
  caidas: number
}

// Respuesta de GET /api/estadisticas/tendencia
export interface RespuestaTendencia {
  granularidad: Granularidad
  desde: string | null
  hasta: string | null
  puntos: PuntoTendencia[]
}

// Fila del top de dispositivos con mas caidas
export interface TopDispositivo {
  idTelefono: number
  extension: string
  ubicacion: string
  tipoUbicacion: string
  caidas: number
}

// Conteos de las distribuciones
export interface ConteoPiso {
  piso: string
  caidas: number
}

export interface ConteoModelo {
  modelo: string
  caidas: number
}

export interface ConteoTipoUbicacion {
  tipoUbicacion: string
  caidas: number
}

// Tiempo de atencion en minutos
export interface TiempoAtencion {
  atendidas: number
  promedioMinutos: number | null
  medianaMinutos: number | null
}

// Carga de incidencias atendidas por usuario
export interface CargaUsuario {
  idUsuario: number
  usuario: string
  atendidas: number
}

// Respuesta de GET /api/estadisticas/resumen
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

// Respuesta de GET /api/estadisticas/foto-actual
export interface RespuestaFotoActual {
  generadoEn: string
  total: number
  online: number
  offline: number
  mantenimiento: number
  desconocido: number
}
