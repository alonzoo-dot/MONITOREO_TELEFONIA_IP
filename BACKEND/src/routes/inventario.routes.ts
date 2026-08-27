import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  listar,
  obtener,
  obtenerDetalle,
  crear,
  editar,
  desactivar,
  reactivar,
  eliminar,
} from '../controllers/inventario.controller';
import { importar, descargarPlantilla } from '../controllers/importacion.controller';
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

// Rutas específicas ANTES de las paramétricas (/:id) para que no las capture
rutasInventario.get('/', listar);
rutasInventario.get('/plantilla', descargarPlantilla);
rutasInventario.post('/importar', manejarSubida, importar);
rutasInventario.get('/:id/detalle', obtenerDetalle);
rutasInventario.get('/:id', obtener);
rutasInventario.post('/', validar(esquemaDispositivo), crear);
rutasInventario.put('/:id', validar(esquemaDispositivo), editar);
rutasInventario.patch('/:id/desactivar', desactivar);
rutasInventario.patch('/:id/reactivar', reactivar);
rutasInventario.delete('/:id', eliminar);

export default rutasInventario;