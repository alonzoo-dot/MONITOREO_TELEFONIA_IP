import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  listar,
  obtener,
  crear,
  editar,
  desactivar,
  reactivar,
} from '../controllers/inventario.controller';
import { importar } from '../controllers/importacion.controller';
import { requiereAutenticacion } from '../middlewares/auth.middleware';
import { requiereRol } from '../middlewares/autorizacion.middleware';
import { validar } from '../middlewares/validacion.middleware';
import { subirExcel } from '../middlewares/subida.middleware';
import { esquemaDispositivo } from '../schemas/dispositivo.schema';

const rutasInventario = Router();

// Todas las rutas de inventario requieren: token válido + rol ADMINISTRADOR
rutasInventario.use(requiereAutenticacion);
rutasInventario.use(requiereRol('ADMINISTRADOR'));

/** Envuelve el middleware de multer para traducir sus errores a respuestas 400. */
function manejarSubida(peticion: Request, respuesta: Response, siguiente: NextFunction): void {
  subirExcel(peticion, respuesta, (error: unknown) => {
    if (error instanceof Error) {
      respuesta.status(400).json({ mensaje: error.message });
      return;
    }
    siguiente();
  });
}

rutasInventario.get('/', listar);
rutasInventario.get('/:id', obtener);
rutasInventario.post('/', validar(esquemaDispositivo), crear);
rutasInventario.post('/importar', manejarSubida, importar);
rutasInventario.put('/:id', validar(esquemaDispositivo), editar);
rutasInventario.delete('/:id', desactivar);
rutasInventario.post('/:id/reactivar', reactivar);

export default rutasInventario;