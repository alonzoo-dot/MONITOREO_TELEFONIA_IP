import type { Request, Response, NextFunction } from 'express';

/** Middleware que exige que el usuario autenticado tenga uno de los roles permitidos. */
export function requiereRol(...rolesPermitidos: string[]) {
  return (peticion: Request, respuesta: Response, siguiente: NextFunction): void => {
    const usuario = peticion.usuario;

    // Debe haber pasado antes por el middleware de autenticación
    if (!usuario) {
      respuesta.status(401).json({ mensaje: 'No autenticado' });
      return;
    }

    // Verificar que su rol esté entre los permitidos
    if (!rolesPermitidos.includes(usuario.tipo_rol)) {
      respuesta.status(403).json({ mensaje: 'No tienes permiso para realizar esta acción' });
      return;
    }

    siguiente(); // rol autorizado, continúa
  };
}