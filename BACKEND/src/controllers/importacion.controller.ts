import type { Request, Response } from 'express';
import * as importacionService from '../services/importacion.service';
import * as plantillaService from '../services/plantilla.service';

/** GET /api/dispositivos/plantilla — descarga la plantilla .xlsx de importación. */
export async function descargarPlantilla(_peticion: Request, respuesta: Response): Promise<void> {
  try {
    const buffer = await plantillaService.generarPlantilla();
    respuesta.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    respuesta.setHeader(
      'Content-Disposition',
      'attachment; filename="plantilla_inventario.xlsx"',
    );
    respuesta.status(200).send(buffer);
  } catch (error: unknown) {
    console.error('Error inesperado al generar la plantilla:', error);
    respuesta.status(500).json({ mensaje: 'Error interno al generar la plantilla' });
  }
}

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