import * as incidenciasRepo from '../repositories/incidencias.repository';
import type {
  FiltrosIncidencias,
  IncidenciaDetalle,
} from '../repositories/incidencias.repository';

// Resultado paginado del historial: las filas de la pagina mas los metadatos de paginacion.
export interface ResultadoIncidencias {
  total: number;
  pagina: number;
  tamanoPagina: number;
  incidencias: IncidenciaDetalle[];
}
// Lista el historial de incidencias aplicando filtros y paginacion.
// Calcula el offset a partir de la pagina y delega el conteo y la busqueda al repositorio.
export async function listarIncidencias(
  filtros: FiltrosIncidencias,
  pagina: number,
  tamanoPagina: number,
): Promise<ResultadoIncidencias> {
  const offset = (pagina - 1) * tamanoPagina;
  const total = await incidenciasRepo.contarIncidencias(filtros);
  const incidencias = await incidenciasRepo.listarIncidencias(filtros, tamanoPagina, offset);
  return { total, pagina, tamanoPagina, incidencias };
}


/** Error de incidencias, con un código para traducir a HTTP. */
export class ErrorIncidencias extends Error {
  constructor(
    public readonly codigo: string,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorIncidencias';
  }
}

/** Cantidad de incidencias pendientes: caídas sin atender. */
export async function obtenerConteoPendientes(): Promise<number> {
  return incidenciasRepo.contarPendientes();
}

// Atiende una caida pendiente. Escribe identidad del usuario fecha del servidor y observacion.
// Valida existencia tipo y que no este ya atendida. Devuelve la incidencia ya atendida.
export async function atenderIncidencia(
  idIncidencia: number,
  idUsuario: number,
  descripcionFalla: string | null,
): Promise<IncidenciaDetalle> {
  const actual = await incidenciasRepo.buscarPorId(idIncidencia);
  if (actual === null) {
    throw new ErrorIncidencias('NO_ENCONTRADO', 'La incidencia no existe.');
  }
  if (actual.tipo_evento !== 'CAIDA') {
    throw new ErrorIncidencias('NO_ATENDIBLE', 'Solo se pueden atender incidencias de caida.');
  }
  if (actual.id_usuario_atendio !== null) {
    throw new ErrorIncidencias('INCIDENCIA_YA_ATENDIDA', 'La incidencia ya fue atendida.');
  }

  const filas = await incidenciasRepo.atenderIncidencia(idIncidencia, idUsuario, descripcionFalla);
  if (filas === 0) {
    // Otra peticion la atendio entre la lectura y el update.
    throw new ErrorIncidencias('INCIDENCIA_YA_ATENDIDA', 'La incidencia ya fue atendida.');
  }

  const atendida = await incidenciasRepo.buscarDetallePorId(idIncidencia);
  if (atendida === null) {
    throw new ErrorIncidencias('NO_ENCONTRADO', 'La incidencia no existe.');
  }
  return atendida;
}