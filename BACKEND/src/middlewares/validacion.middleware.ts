import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

/**
 * Middleware genérico de validación. Recibe un esquema Zod y valida req.body
 * contra él. Si falla, responde 400 con la lista de campos inválidos. Si pasa,
 * reemplaza req.body con los datos ya validados y tipados, y continúa.
 */
export function validar(esquema: ZodType) {
  return (peticion: Request, respuesta: Response, siguiente: NextFunction): void => {
    const resultado = esquema.safeParse(peticion.body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((incidencia) => ({
        campo: incidencia.path.join('.'),
        detalle: incidencia.message,
      }));
      respuesta.status(400).json({ mensaje: 'Datos inválidos', errores });
      return;
    }

    peticion.body = resultado.data;
    siguiente();
  };
}
