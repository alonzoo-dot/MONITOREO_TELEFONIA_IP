import { Router } from 'express';
import { obtenerConteoPendientes, listar, atender } from '../controllers/incidencias.controller';
import { requiereAutenticacion } from '../middlewares/auth.middleware';
import { requiereRol } from '../middlewares/autorizacion.middleware';
import { validar } from '../middlewares/validacion.middleware';
import { esquemaAtenderIncidencia } from '../schemas/incidencia.schema';

const rutasIncidencias = Router();

// Todas las rutas de incidencias requieren token válido + rol ADMINISTRADOR o TECNICO.
rutasIncidencias.use(requiereAutenticacion);
rutasIncidencias.use(requiereRol('ADMINISTRADOR', 'TECNICO'));

// Rutas específicas antes que las paramétricas (aplicará cuando existan /:id).
rutasIncidencias.get('/pendientes/conteo', obtenerConteoPendientes);
rutasIncidencias.get('/', listar);
rutasIncidencias.patch('/:id/atender', validar(esquemaAtenderIncidencia), atender);

export default rutasIncidencias;