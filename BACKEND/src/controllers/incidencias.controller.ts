import type { Request, Response } from 'express';
import * as incidenciasService from '../services/incidencias.service';
import { ErrorIncidencias } from '../services/incidencias.service';
import { esquemaFiltrosIncidencias } from '../schemas/incidencia.schema';
import { esquemaAtenderIncidencia } from '../schemas/incidencia.schema';
import type { FiltrosIncidencias } from '../repositories/incidencias.repository';

/**
 * Traduce un ErrorIncidencias a su código HTTP según el 'codigo' del error.
 * Devuelve true si manejó el error; false si no era un ErrorIncidencias.
 */
function manejarErrorIncidencias(error: unknown, respuesta: Response): boolean {
  if (!(error instanceof ErrorIncidencias)) {
    return false;
  }
  const estados: Record<string, number> = {
    NO_ENCONTRADO: 404,
    NO_ATENDIBLE: 400,
    INCIDENCIA_YA_ATENDIDA: 409,
  };
  const estado = estados[error.codigo] ?? 400;
  respuesta.status(estado).json({ mensaje: error.message, codigo: error.codigo });
  return true;
}

/** GET /api/incidencias/pendientes/conteo — cantidad de caídas sin atender. */
export async function obtenerConteoPendientes(
  _peticion: Request,
  respuesta: Response,
): Promise<void> {
  try {
    const pendientes = await incidenciasService.obtenerConteoPendientes();
    respuesta.status(200).json({ pendientes });
  } catch (error: unknown) {
    if (manejarErrorIncidencias(error, respuesta)) return;
    console.error('Error inesperado al obtener el conteo de pendientes:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

// GET /api/incidencias lista el historial con filtros y paginacion.
export async function listar(peticion: Request, respuesta: Response): Promise<void> {
  const parseo = esquemaFiltrosIncidencias.safeParse(peticion.query);
  if (!parseo.success) {
    const errores = parseo.error.issues.map((incidencia) => ({
      campo: incidencia.path.join('.'),
      detalle: incidencia.message,
    }));
    respuesta.status(400).json({ mensaje: 'Filtros invalidos', errores });
    return;
  }

  const { pagina, tamanoPagina, soloPendientes, ...resto } = parseo.data;
  const filtros: FiltrosIncidencias = { ...resto, soloPendientes };

  try {
    const resultado = await incidenciasService.listarIncidencias(filtros, pagina, tamanoPagina);
    respuesta.status(200).json(resultado);
  } catch (error: unknown) {
    if (manejarErrorIncidencias(error, respuesta)) return;
    console.error('Error inesperado al listar incidencias:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

// PATCH /api/incidencias/:id/atender  marca una caida como atendida por el usuario del token.
export async function atender(peticion: Request, respuesta: Response): Promise<void> {
  const idIncidencia = Number(peticion.params.id);
  if (!Number.isInteger(idIncidencia)) {
    respuesta.status(400).json({ mensaje: 'Id de incidencia invalido' });
    return;
  }

  const idUsuario = peticion.usuario?.id_usuario;
  if (idUsuario === undefined) {
    respuesta.status(401).json({ mensaje: 'No autenticado' });
    return;
  }

  const parseo = esquemaAtenderIncidencia.safeParse(peticion.body);
  if (!parseo.success) {
    const errores = parseo.error.issues.map((incidencia) => ({
      campo: incidencia.path.join('.'),
      detalle: incidencia.message,
    }));
    respuesta.status(400).json({ mensaje: 'Datos invalidos', errores });
    return;
  }

  const descripcionFalla = parseo.data.descripcion_falla ?? null;

  try {
    const atendida = await incidenciasService.atenderIncidencia(idIncidencia, idUsuario, descripcionFalla);
    respuesta.status(200).json(atendida);
  } catch (error: unknown) {
    if (manejarErrorIncidencias(error, respuesta)) return;
    console.error('Error inesperado al atender la incidencia:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}