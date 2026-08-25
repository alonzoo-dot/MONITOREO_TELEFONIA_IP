import { Router } from 'express';
import {
  obtenerEstado,
  stream,
  obtenerPendientes,
  activarMantenimiento,
  desactivarMantenimiento,
} from '../controllers/monitoreo.controller';
import { requiereAutenticacion, autenticarConToken } from '../middlewares/auth.middleware';
import { requiereRol } from '../middlewares/autorizacion.middleware';

const rutasMonitoreo = Router();

// El módulo de monitoreo lo pueden usar tanto administradores como técnicos.
const permiteMonitoreo = requiereRol('ADMINISTRADOR', 'TECNICO');

rutasMonitoreo.get('/estado', requiereAutenticacion, permiteMonitoreo, obtenerEstado);
// SSE: el EventSource del navegador no manda headers, así que el token viaja en la query.
rutasMonitoreo.get('/eventos', autenticarConToken, permiteMonitoreo, stream);
rutasMonitoreo.get('/pendientes', requiereAutenticacion, permiteMonitoreo, obtenerPendientes);
rutasMonitoreo.patch(
  '/:id/mantenimiento/activar',
  requiereAutenticacion,
  permiteMonitoreo,
  activarMantenimiento,
);
rutasMonitoreo.patch(
  '/:id/mantenimiento/desactivar',
  requiereAutenticacion,
  permiteMonitoreo,
  desactivarMantenimiento,
);

export default rutasMonitoreo;
