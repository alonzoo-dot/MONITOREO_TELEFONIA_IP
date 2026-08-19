import type { Request, Response } from 'express';
import * as monitoreoService from '../services/monitoreo.service';
import * as eventosSse from '../services/eventosSse.service';

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
