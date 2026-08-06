import type { Request, Response } from 'express';
import {
  registrarUsuario,
  obtenerUsuarios,
  editarUsuario,
  resetearPassword,
  ErrorUsuarios,
} from '../services/usuarios.service';

/** POST /api/usuarios — crea un usuario nuevo con contraseña temporal. */
export async function crear(peticion: Request, respuesta: Response): Promise<void> {
  const { usuario, nombre_completo, id_rol } = peticion.body ?? {};

  if (
    typeof usuario !== 'string' || !usuario ||
    typeof nombre_completo !== 'string' || !nombre_completo ||
    typeof id_rol !== 'number'
  ) {
    respuesta.status(400).json({ mensaje: 'usuario, nombre_completo e id_rol son obligatorios' });
    return;
  }

  try {
    const resultado = await registrarUsuario(usuario, nombre_completo, id_rol);
    respuesta.status(201).json(resultado);
  } catch (error: unknown) {
    if (error instanceof ErrorUsuarios) {
      respuesta.status(409).json({ mensaje: error.message });
      return;
    }
    console.error('Error inesperado al crear usuario:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** GET /api/usuarios — devuelve la lista de todos los usuarios. */
export async function listar(_peticion: Request, respuesta: Response): Promise<void> {
  try {
    const usuarios = await obtenerUsuarios();
    respuesta.status(200).json(usuarios);
  } catch (error: unknown) {
    console.error('Error inesperado al listar usuarios:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** PUT /api/usuarios/:id — edita un usuario existente. */
export async function editar(peticion: Request, respuesta: Response): Promise<void> {
  const idUsuario = Number(peticion.params.id);
  const { nombre_completo, id_rol, activo } = peticion.body ?? {};

  if (
    !Number.isInteger(idUsuario) ||
    typeof nombre_completo !== 'string' || !nombre_completo ||
    typeof id_rol !== 'number' ||
    typeof activo !== 'boolean'
  ) {
    respuesta.status(400).json({ mensaje: 'Datos inválidos para editar el usuario' });
    return;
  }

  try {
    await editarUsuario(idUsuario, nombre_completo, id_rol, activo);
    respuesta.status(200).json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (error: unknown) {
    if (error instanceof ErrorUsuarios) {
      respuesta.status(404).json({ mensaje: error.message });
      return;
    }
    console.error('Error inesperado al editar usuario:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** POST /api/usuarios/:id/reset-password — resetea la contraseña de un usuario. */
export async function resetear(peticion: Request, respuesta: Response): Promise<void> {
  const idUsuario = Number(peticion.params.id);

  if (!Number.isInteger(idUsuario)) {
    respuesta.status(400).json({ mensaje: 'Id de usuario inválido' });
    return;
  }

  try {
    const passwordTemporal = await resetearPassword(idUsuario);
    respuesta.status(200).json({ password_temporal: passwordTemporal });
  } catch (error: unknown) {
    if (error instanceof ErrorUsuarios) {
      respuesta.status(404).json({ mensaje: error.message });
      return;
    }
    console.error('Error inesperado al resetear contraseña:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}