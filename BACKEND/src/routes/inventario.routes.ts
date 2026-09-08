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
  eliminarPermanentemente,
} from '../controllers/inventario.controller';
import { importar, descargarPlantilla } from '../controllers/importacion.controller';
import { requiereAutenticacion } from '../middlewares/auth.middleware';
import { requiereRol } from '../middlewares/autorizacion.middleware';
import { validar } from '../middlewares/validacion.middleware';
import { subirExcel } from '../middlewares/subida.middleware';
import { esquemaDispositivo } from '../schemas/dispositivo.schema';

const rutasInventario = Router();

// Todas las rutas de inventario requieren token valido. El rol se aplica por endpoint.
// Lectura (GET del listado y del detalle) la pueden usar ADMINISTRADOR y TECNICO.
// La escritura y la importacion son solo ADMINISTRADOR.
rutasInventario.use(requiereAutenticacion);

const permiteLectura = requiereRol('ADMINISTRADOR', 'TECNICO');
const permiteEscritura = requiereRol('ADMINISTRADOR');

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

// Rutas especificas ANTES de las parametricas (/:id) para que no las capture
// Lectura: listado y detalle disponibles para ADMINISTRADOR y TECNICO
rutasInventario.get('/', permiteLectura, listar);
// La plantilla es parte del flujo de importacion: solo ADMINISTRADOR
rutasInventario.get('/plantilla', permiteEscritura, descargarPlantilla);
rutasInventario.post('/importar', permiteEscritura, manejarSubida, importar);
rutasInventario.get('/:id/detalle', permiteLectura, obtenerDetalle);
rutasInventario.get('/:id', permiteLectura, obtener);
// Escritura: solo ADMINISTRADOR
rutasInventario.post('/', permiteEscritura, validar(esquemaDispositivo), crear);
rutasInventario.put('/:id', permiteEscritura, validar(esquemaDispositivo), editar);
rutasInventario.patch('/:id/desactivar', permiteEscritura, desactivar);
rutasInventario.patch('/:id/reactivar', permiteEscritura, reactivar);
rutasInventario.delete('/:id/permanente', permiteEscritura, eliminarPermanentemente);
rutasInventario.delete('/:id', permiteEscritura, eliminar);

export default rutasInventario;