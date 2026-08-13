import type { Request, Response } from 'express';
import * as catalogosService from '../services/catalogos.service';

/** GET /api/catalogos/modelos-ata — lista los modelos de ATA. */
export async function listarModelosAta(
  _peticion: Request,
  respuesta: Response,
): Promise<void> {
  try {
    const modelos = await catalogosService.listarModelosAta();
    respuesta.status(200).json(modelos);
  } catch (error: unknown) {
    console.error('Error inesperado al listar modelos de ATA:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** GET /api/catalogos/modelos-telefono — lista los modelos de teléfono. */
export async function listarModelosTelefono(
  _peticion: Request,
  respuesta: Response,
): Promise<void> {
  try {
    const modelos = await catalogosService.listarModelosTelefono();
    respuesta.status(200).json(modelos);
  } catch (error: unknown) {
    console.error('Error inesperado al listar modelos de teléfono:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** GET /api/catalogos/departamentos — lista los departamentos. */
export async function listarDepartamentos(
  _peticion: Request,
  respuesta: Response,
): Promise<void> {
  try {
    const departamentos = await catalogosService.listarDepartamentos();
    respuesta.status(200).json(departamentos);
  } catch (error: unknown) {
    console.error('Error inesperado al listar departamentos:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}