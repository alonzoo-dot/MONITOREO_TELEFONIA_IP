import type { Request, Response } from 'express';
import * as catalogosService from '../services/catalogos.service';
import { ErrorCatalogos } from '../services/catalogos.service';

/**
 * Traduce un ErrorCatalogos a su código HTTP. Devuelve true si lo manejó.
 */
function manejarErrorCatalogos(error: unknown, respuesta: Response): boolean {
  if (!(error instanceof ErrorCatalogos)) {
    return false;
  }
  const estados: Record<string, number> = {
    MODELO_DUPLICADO: 409,
    EN_USO: 409,
    NO_ENCONTRADO: 404,
  };
  const estado = estados[error.codigo] ?? 400;
  respuesta.status(estado).json({ mensaje: error.message, codigo: error.codigo });
  return true;
}

/** Valida que el :id de la ruta sea un entero. Devuelve el número o null. */
function idValido(valor: string | string[] | undefined): number | null {
  if (typeof valor !== 'string') return null;
  const id = Number(valor);
  return Number.isInteger(id) ? id : null;
}
/* ===================== Modelos de ATA ===================== */

/** GET /api/catalogos/modelos-ata */
export async function listarModelosAta(_peticion: Request, respuesta: Response): Promise<void> {
  try {
    const modelos = await catalogosService.listarModelosAta();
    respuesta.status(200).json(modelos);
  } catch (error: unknown) {
    console.error('Error inesperado al listar modelos de ATA:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** POST /api/catalogos/modelos-ata */
export async function crearModeloAta(peticion: Request, respuesta: Response): Promise<void> {
  try {
    const id = await catalogosService.crearModeloAta(peticion.body);
    respuesta.status(201).json({ id_modelo_ata: id });
  } catch (error: unknown) {
    if (manejarErrorCatalogos(error, respuesta)) return;
    console.error('Error inesperado al crear modelo de ATA:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** PUT /api/catalogos/modelos-ata/:id */
export async function editarModeloAta(peticion: Request, respuesta: Response): Promise<void> {
  const id = idValido(peticion.params.id);
  if (id === null) {
    respuesta.status(400).json({ mensaje: 'Id inválido' });
    return;
  }
  try {
    await catalogosService.actualizarModeloAta(id, peticion.body);
    respuesta.status(200).json({ mensaje: 'Modelo de ATA actualizado correctamente' });
  } catch (error: unknown) {
    if (manejarErrorCatalogos(error, respuesta)) return;
    console.error('Error inesperado al editar modelo de ATA:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/* ===================== Modelos de teléfono ===================== */

/** GET /api/catalogos/modelos-telefono */
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

/** POST /api/catalogos/modelos-telefono */
export async function crearModeloTelefono(
  peticion: Request,
  respuesta: Response,
): Promise<void> {
  try {
    const id = await catalogosService.crearModeloTelefono(peticion.body);
    respuesta.status(201).json({ id_modelo_telefono: id });
  } catch (error: unknown) {
    if (manejarErrorCatalogos(error, respuesta)) return;
    console.error('Error inesperado al crear modelo de teléfono:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** PUT /api/catalogos/modelos-telefono/:id */
export async function editarModeloTelefono(
  peticion: Request,
  respuesta: Response,
): Promise<void> {
  const id = idValido(peticion.params.id);
  if (id === null) {
    respuesta.status(400).json({ mensaje: 'Id inválido' });
    return;
  }
  try {
    await catalogosService.actualizarModeloTelefono(id, peticion.body);
    respuesta.status(200).json({ mensaje: 'Modelo de teléfono actualizado correctamente' });
  } catch (error: unknown) {
    if (manejarErrorCatalogos(error, respuesta)) return;
    console.error('Error inesperado al editar modelo de teléfono:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/* ===================== Departamentos ===================== */

/** GET /api/catalogos/departamentos */
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

/** POST /api/catalogos/departamentos */
export async function crearDepartamento(peticion: Request, respuesta: Response): Promise<void> {
  try {
    const id = await catalogosService.crearDepartamento(peticion.body);
    respuesta.status(201).json({ id_departamento: id });
  } catch (error: unknown) {
    if (manejarErrorCatalogos(error, respuesta)) return;
    console.error('Error inesperado al crear departamento:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** PUT /api/catalogos/departamentos/:id */
export async function editarDepartamento(peticion: Request, respuesta: Response): Promise<void> {
  const id = idValido(peticion.params.id);
  if (id === null) {
    respuesta.status(400).json({ mensaje: 'Id inválido' });
    return;
  }
  try {
    await catalogosService.actualizarDepartamento(id, peticion.body);
    respuesta.status(200).json({ mensaje: 'Departamento actualizado correctamente' });
  } catch (error: unknown) {
    if (manejarErrorCatalogos(error, respuesta)) return;
    console.error('Error inesperado al editar departamento:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/* ===================== Borrado ===================== */

/** DELETE /api/catalogos/modelos-ata/:id */
export async function eliminarModeloAta(peticion: Request, respuesta: Response): Promise<void> {
  const id = idValido(peticion.params.id);
  if (id === null) {
    respuesta.status(400).json({ mensaje: 'Id inválido' });
    return;
  }
  try {
    await catalogosService.eliminarModeloAta(id);
    respuesta.status(200).json({ mensaje: 'Modelo de ATA eliminado correctamente' });
  } catch (error: unknown) {
    if (manejarErrorCatalogos(error, respuesta)) return;
    console.error('Error inesperado al eliminar modelo de ATA:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** DELETE /api/catalogos/modelos-telefono/:id */
export async function eliminarModeloTelefono(
  peticion: Request,
  respuesta: Response,
): Promise<void> {
  const id = idValido(peticion.params.id);
  if (id === null) {
    respuesta.status(400).json({ mensaje: 'Id inválido' });
    return;
  }
  try {
    await catalogosService.eliminarModeloTelefono(id);
    respuesta.status(200).json({ mensaje: 'Modelo de teléfono eliminado correctamente' });
  } catch (error: unknown) {
    if (manejarErrorCatalogos(error, respuesta)) return;
    console.error('Error inesperado al eliminar modelo de teléfono:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** DELETE /api/catalogos/departamentos/:id */
export async function eliminarDepartamento(peticion: Request, respuesta: Response): Promise<void> {
  const id = idValido(peticion.params.id);
  if (id === null) {
    respuesta.status(400).json({ mensaje: 'Id inválido' });
    return;
  }
  try {
    await catalogosService.eliminarDepartamento(id);
    respuesta.status(200).json({ mensaje: 'Departamento eliminado correctamente' });
  } catch (error: unknown) {
    if (manejarErrorCatalogos(error, respuesta)) return;
    console.error('Error inesperado al eliminar departamento:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}
