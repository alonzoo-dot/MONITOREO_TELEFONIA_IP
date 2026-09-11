import type { Request, Response } from 'express';
import * as llamadasService from '../services/llamadas.service';
import { ErrorLlamadas } from '../gateways/errores';
import type { MarcarValidado, HacerTimbrarValidado } from '../schemas/llamadas.schema';

/**
 * Traduce un ErrorLlamadas a su código HTTP según el 'codigo' del error.
 * Devuelve true si manejó el error; false si no era un ErrorLlamadas.
 */
function manejarErrorLlamadas(error: unknown, respuesta: Response): boolean {
  if (!(error instanceof ErrorLlamadas)) {
    return false;
  }
  const estados: Record<string, number> = {
    ORIGEN_NO_ENCONTRADO: 404,
    DESTINO_NO_ENCONTRADO: 404,
    TIPO_NO_COMPATIBLE: 409,
    SIN_IP: 409,
  };
  const estado = estados[error.codigo] ?? 400;
  respuesta.status(estado).json({ mensaje: error.message, codigo: error.codigo });
  return true;
}

/** GET /api/llamadas/dispositivos — lista los dispositivos activos con su accion de llamada. */
export async function listarDispositivos(_peticion: Request, respuesta: Response): Promise<void> {
  try {
    const dispositivos = await llamadasService.listarDispositivos();
    respuesta.status(200).json(dispositivos);
  } catch (error: unknown) {
    if (manejarErrorLlamadas(error, respuesta)) return;
    console.error('Error inesperado al listar dispositivos para llamadas:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

// POST /api/llamadas/marcar  marca desde un telefono IP nativo hacia una extension destino.
// exito:false del gateway no es un error HTTP: se responde 200 con el ResultadoLlamada.
export async function marcar(peticion: Request, respuesta: Response): Promise<void> {
  const { idOrigen, extensionDestino } = peticion.body as MarcarValidado;

  try {
    const resultado = await llamadasService.marcar(idOrigen, extensionDestino);
    respuesta.status(200).json(resultado);
  } catch (error: unknown) {
    if (manejarErrorLlamadas(error, respuesta)) return;
    console.error('Error inesperado al marcar:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

// POST /api/llamadas/hacer-timbrar  hace timbrar un telefono via softphone SIP.
export async function hacerTimbrar(peticion: Request, respuesta: Response): Promise<void> {
  const { extensionOrigen, usuarioSip, passwordSip, extensionDestino } = peticion.body as HacerTimbrarValidado;

  try {
    const resultado = await llamadasService.hacerTimbrar(
      extensionOrigen,
      usuarioSip,
      passwordSip,
      extensionDestino,
    );
    respuesta.status(200).json(resultado);
  } catch (error: unknown) {
    if (manejarErrorLlamadas(error, respuesta)) return;
    console.error('Error inesperado al hacer timbrar:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}
