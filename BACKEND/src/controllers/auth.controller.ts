import type { Request, Response } from 'express';
import { iniciarSesion, cambiarPassword, ErrorAutenticacion } from '../services/auth.service';

/** inicia sesión y devuelve un token. */
export async function login(peticion: Request, respuesta: Response): Promise<void> {
  const { usuario, password } = peticion.body ?? {};

  // Validación básica de entrada
  if (typeof usuario !== 'string' || typeof password !== 'string' || !usuario || !password) {
    respuesta.status(400).json({ mensaje: 'Usuario y contraseña son obligatorios' });
    return;
  }

  try {
    const resultado = await iniciarSesion(usuario, password);
    respuesta.status(200).json(resultado);
  } catch (error: unknown) {
    if (error instanceof ErrorAutenticacion) {
      respuesta.status(401).json({ mensaje: error.message });
      return;
    }
    console.error('Error inesperado en login:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** cambia la contraseña del usuario autenticado. */
export async function cambiarPasswordControlador(
  peticion: Request,
  respuesta: Response,
): Promise<void> {
  const { password_nuevo, password_actual } = peticion.body ?? {};

  // Validación básica
  if (typeof password_nuevo !== 'string' || !password_nuevo) {
    respuesta.status(400).json({ mensaje: 'La nueva contraseña es obligatoria' });
    return;
  }

  // Los datos del usuario vienen del token (los pondrá el middleware)
  const usuarioAutenticado = peticion.usuario;
  if (!usuarioAutenticado) {
    respuesta.status(401).json({ mensaje: 'No autenticado' });
    return;
  }

  try {
    await cambiarPassword(
      usuarioAutenticado.id_usuario,
      usuarioAutenticado.usuario,
      password_nuevo,
      typeof password_actual === 'string' ? password_actual : undefined,
    );
    respuesta.status(200).json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error: unknown) {
    if (error instanceof ErrorAutenticacion) {
      respuesta.status(401).json({ mensaje: error.message });
      return;
    }
    console.error('Error inesperado al cambiar contraseña:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}