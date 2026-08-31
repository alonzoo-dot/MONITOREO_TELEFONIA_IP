import type { Request, Response } from 'express';
import * as monitoreoService from '../services/monitoreo.service';
import { ErrorMonitoreo } from '../services/monitoreo.service';
import * as eventosSse from '../services/eventosSse.service';

/**
 * Traduce un ErrorMonitoreo a su código HTTP según el 'codigo' del error.
 * Devuelve true si manejó el error; false si no era un ErrorMonitoreo.
 */
function manejarErrorMonitoreo(error: unknown, respuesta: Response): boolean {
  if (!(error instanceof ErrorMonitoreo)) {
    return false;
  }
  const estados: Record<string, number> = {
    NO_ENCONTRADO: 404,
    YA_EN_MANTENIMIENTO: 409,
    NO_EN_MANTENIMIENTO: 409,
  };
  const estado = estados[error.codigo] ?? 400;
  respuesta.status(estado).json({ mensaje: error.message, codigo: error.codigo });
  return true;
}

/** GET /api/monitoreo/estado — snapshot en memoria del estado de los dispositivos. */
export function obtenerEstado(_peticion: Request, respuesta: Response): void {
  try {
    const estado = monitoreoService.obtenerEstadoActual();
    respuesta.status(200).json(estado);
  } catch (error: unknown) {
    console.error('Error inesperado al obtener el estado de monitoreo:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** GET /api/monitoreo/eventos — stream SSE de eventos del motor. La conexión se deja abierta. */
export function stream(peticion: Request, respuesta: Response): void {
  eventosSse.registrarCliente(respuesta);
  peticion.on('close', () => eventosSse.eliminarCliente(respuesta));
}

/** GET /api/monitoreo/pendientes — cantidad de incidencias sin atender. */
export async function obtenerPendientes(_peticion: Request, respuesta: Response): Promise<void> {
  try {
    const pendientes = await monitoreoService.obtenerConteoPendientes();
    respuesta.status(200).json({ pendientes });
  } catch (error: unknown) {
    console.error('Error inesperado al obtener las incidencias pendientes:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** PATCH /api/monitoreo/:id/mantenimiento/activar — pone un dispositivo en mantenimiento. */
export async function activarMantenimiento(peticion: Request, respuesta: Response): Promise<void> {
  const idTelefono = Number(peticion.params.id);
  if (!Number.isInteger(idTelefono)) {
    respuesta.status(400).json({ mensaje: 'Id de dispositivo inválido' });
    return;
  }

  const idUsuario = peticion.usuario?.id_usuario;
  if (!idUsuario) {
    respuesta.status(401).json({ mensaje: 'No autenticado' });
    return;
  }

  try {
    await monitoreoService.activarMantenimiento(idTelefono, idUsuario);
    respuesta.status(204).send();
  } catch (error: unknown) {
    if (manejarErrorMonitoreo(error, respuesta)) return;
    console.error('Error inesperado al activar mantenimiento:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** PATCH /api/monitoreo/:id/mantenimiento/desactivar — saca un dispositivo de mantenimiento. */
export async function desactivarMantenimiento(
  peticion: Request,
  respuesta: Response,
): Promise<void> {
  const idTelefono = Number(peticion.params.id);
  if (!Number.isInteger(idTelefono)) {
    respuesta.status(400).json({ mensaje: 'Id de dispositivo inválido' });
    return;
  }

  const idUsuario = peticion.usuario?.id_usuario;
  if (!idUsuario) {
    respuesta.status(401).json({ mensaje: 'No autenticado' });
    return;
  }

  try {
    await monitoreoService.desactivarMantenimiento(idTelefono, idUsuario);
    respuesta.status(204).send();
  } catch (error: unknown) {
    if (manejarErrorMonitoreo(error, respuesta)) return;
    console.error('Error inesperado al desactivar mantenimiento:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}
