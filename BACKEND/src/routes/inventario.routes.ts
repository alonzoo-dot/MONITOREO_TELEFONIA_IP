import { Router } from 'express';
import {
  listar,
  obtener,
  crear,
  editar,
  desactivar,
  reactivar,
} from '../controllers/inventario.controller';
import { requiereAutenticacion } from '../middlewares/auth.middleware';
import { requiereRol } from '../middlewares/autorizacion.middleware';
import { validar } from '../middlewares/validacion.middleware';
import { esquemaDispositivo } from '../schemas/dispositivo.schema';

const rutasInventario = Router();

// Todas las rutas de inventario requieren: token válido + rol ADMINISTRADOR
rutasInventario.use(requiereAutenticacion);
rutasInventario.use(requiereRol('ADMINISTRADOR'));

rutasInventario.get('/', listar);
rutasInventario.get('/:id', obtener);
rutasInventario.post('/', validar(esquemaDispositivo), crear);
rutasInventario.put('/:id', validar(esquemaDispositivo), editar);
rutasInventario.delete('/:id', desactivar);
rutasInventario.post('/:id/reactivar', reactivar);

export default rutasInventario;
