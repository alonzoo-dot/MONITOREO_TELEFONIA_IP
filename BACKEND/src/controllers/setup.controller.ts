import type { Request, Response } from 'express';
import {
  requiereConfiguracion,
  registrarPrimerAdministrador,
  ErrorSetup,
} from '../services/setup.service';

/** GET /api/setup/estado indica si el sistema necesita configuracion inicial. */
export async function estado(_peticion: Request, respuesta: Response): Promise<void> {
  try {
    const requiere = await requiereConfiguracion();
    respuesta.status(200).json({ requiere_configuracion: requiere });
  } catch (error: unknown) {
    console.error('Error inesperado al consultar el estado de configuracion:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

/** POST /api/setup crea el primer administrador del sistema. */
export async function configurar(peticion: Request, respuesta: Response): Promise<void> {
  const { usuario, nombre_completo, password } = peticion.body;

  try {
    const idUsuario = await registrarPrimerAdministrador(usuario, nombre_completo, password);
    respuesta.status(201).json({
      id_usuario: idUsuario,
      usuario,
      mensaje: 'Administrador creado correctamente',
    });
  } catch (error: unknown) {
    if (error instanceof ErrorSetup) {
      respuesta.status(409).json({ mensaje: error.message, codigo: error.codigo });
      return;
    }
    console.error('Error inesperado en la configuracion inicial:', error);
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}
