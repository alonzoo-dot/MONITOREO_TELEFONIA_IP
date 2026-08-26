import type { Request, Response } from 'express';
import * as inventarioService from '../services/inventario.service';
import { ErrorInventario } from '../services/inventario.service';
import type { DatosDispositivo } from '../services/inventario.service';
import type { FiltrosDispositivo } from '../repositories/telefonos.repository';
import type { DispositivoValidado } from '../schemas/dispositivo.schema';

/**
 * Traduce un ErrorInventario a su código HTTP según el 'codigo' del error.
 * Devuelve true si manejó el error; false si no era un ErrorInventario.
 */
function manejarErrorInventario(error: unknown, respuesta: Response): boolean {
  if (!(error instanceof ErrorInventario)) {
    return false;
  }
  const estados: Record<string, number> = {
    NO_ENCONTRADO: 404,
    EXTENSION_DUPLICADA: 409,
    MAC_DUPLICADA: 409,
    IP_DUPLICADA: 409,
    MAC_REQUERIDA: 400,
    MAC_NO_PERMITIDA: 400,
    IP_REQUERIDA: 400,
    IP_NO_PERMITIDA: 400,
    SERIE_ATA_REQUERIDA: 400,
    MODELO_ATA_REQUERIDO: 400,
    TIPO_NO_EDITABLE: 400,
    TIENE_INCIDENCIAS: 409,
  };
  const estado = estados[error.codigo] ?? 400;
  respuesta.status(estado).json({ mensaje: error.message, codigo: error.codigo });
  return true;
}

/** GET /api/dispositivos — lista los dispositivos con filtros opcionales. */
export async function listar(peticion: Request, respuesta: Response): Promise<void> {
  const filtros: FiltrosDispositivo = {};
  const { tipo, piso, id_modelo_telefono, activo, busqueda, incluir_inactivos } = peticion.query;

  if (typeof tipo === 'string') filtros.tipo = tipo;
  if (typeof piso === 'string' && piso !== '') filtros.piso = Number(piso);
  if (typeof id_modelo_telefono === 'string' && id_modelo_telefono !== '') {
    filtros.id_modelo_telefono = Number(id_modelo_telefono);
  }
  if (activo === 'true') filtros.activo = true;
  if (activo === 'false') filtros.activo = false;
  if (typeof busqueda === 'string' && busqueda !== '') filtros.busqueda = busqueda;
  if (incluir_inactivos === 'true') filtros.incluir_inactivos = true;

  try {
    const dispositivos = await inventarioService.listarDispositivos(filtros);
    respuesta.status(200).json(dispositivos);
  } catch (error: unknown) {
    console.error('Error inesperado al listar dispositivos:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** GET /api/dispositivos/:id — devuelve el detalle de un dispositivo. */
export async function obtener(peticion: Request, respuesta: Response): Promise<void> {
  const idTelefono = Number(peticion.params.id);
  if (!Number.isInteger(idTelefono)) {
    respuesta.status(400).json({ mensaje: 'Id de dispositivo inválido' });
    return;
  }

  try {
    const dispositivo = await inventarioService.obtenerDispositivo(idTelefono);
    respuesta.status(200).json(dispositivo);
  } catch (error: unknown) {
    if (manejarErrorInventario(error, respuesta)) return;
    console.error('Error inesperado al obtener dispositivo:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** POST /api/dispositivos — crea un dispositivo nuevo. Body ya validado por Zod. */
export async function crear(peticion: Request, respuesta: Response): Promise<void> {
  try {
    const datos = peticion.body as DispositivoValidado as DatosDispositivo;
    const dispositivo = await inventarioService.crearDispositivo(datos);
    respuesta.status(201).json(dispositivo);
  } catch (error: unknown) {
    if (manejarErrorInventario(error, respuesta)) return;
    console.error('Error inesperado al crear dispositivo:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** PUT /api/dispositivos/:id — edita un dispositivo. Body ya validado por Zod. */
export async function editar(peticion: Request, respuesta: Response): Promise<void> {
  const idTelefono = Number(peticion.params.id);
  if (!Number.isInteger(idTelefono)) {
    respuesta.status(400).json({ mensaje: 'Id de dispositivo inválido' });
    return;
  }

  try {
    const datos = peticion.body as DispositivoValidado as DatosDispositivo;
    const dispositivo = await inventarioService.actualizarDispositivo(idTelefono, datos);
    respuesta.status(200).json(dispositivo);
  } catch (error: unknown) {
    if (manejarErrorInventario(error, respuesta)) return;
    console.error('Error inesperado al editar dispositivo:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** PATCH /api/dispositivos/:id/desactivar — baja lógica de un dispositivo. */
export async function desactivar(peticion: Request, respuesta: Response): Promise<void> {
  const idTelefono = Number(peticion.params.id);
  if (!Number.isInteger(idTelefono)) {
    respuesta.status(400).json({ mensaje: 'Id de dispositivo inválido' });
    return;
  }

  try {
    await inventarioService.desactivarDispositivo(idTelefono);
    respuesta.status(204).send();
  } catch (error: unknown) {
    if (manejarErrorInventario(error, respuesta)) return;
    console.error('Error inesperado al dar de baja el dispositivo:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** PATCH /api/dispositivos/:id/reactivar — reactiva un dispositivo dado de baja. */
export async function reactivar(peticion: Request, respuesta: Response): Promise<void> {
  const idTelefono = Number(peticion.params.id);
  if (!Number.isInteger(idTelefono)) {
    respuesta.status(400).json({ mensaje: 'Id de dispositivo inválido' });
    return;
  }

  try {
    await inventarioService.reactivarDispositivo(idTelefono);
    respuesta.status(204).send();
  } catch (error: unknown) {
    if (manejarErrorInventario(error, respuesta)) return;
    console.error('Error inesperado al reactivar el dispositivo:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** DELETE /api/dispositivos/:id — borrado físico de un dispositivo. */
export async function eliminar(peticion: Request, respuesta: Response): Promise<void> {
  const idTelefono = Number(peticion.params.id);
  if (!Number.isInteger(idTelefono)) {
    respuesta.status(400).json({ mensaje: 'Id de dispositivo inválido' });
    return;
  }

  try {
    await inventarioService.eliminarDispositivo(idTelefono);
    respuesta.status(204).send();
  } catch (error: unknown) {
    if (manejarErrorInventario(error, respuesta)) return;
    console.error('Error inesperado al eliminar el dispositivo:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}
