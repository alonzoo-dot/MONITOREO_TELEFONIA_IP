import type { Request, Response } from 'express';
import * as importacionService from '../services/importacion.service';

/** POST /api/dispositivos/importar — importa dispositivos desde un archivo .xlsx. */
export async function importar(peticion: Request, respuesta: Response): Promise<void> {
  if (!peticion.file) {
    respuesta.status(400).json({ mensaje: 'No se recibió ningún archivo.' });
    return;
  }

  try {
    const reporte = await importacionService.importarInventario(peticion.file.buffer);
    respuesta.status(200).json(reporte);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Error al procesar el archivo';
    if (mensaje.includes('hoja') || mensaje.includes('archivo')) {
      respuesta.status(400).json({ mensaje });
      return;
    }
    console.error('Error inesperado al importar inventario:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor al importar' });
  }
}