import { Router } from 'express';
import { listarDispositivos, marcar, hacerTimbrar, colgar } from '../controllers/llamadas.controller';
import { requiereAutenticacion } from '../middlewares/auth.middleware';
import { requiereRol } from '../middlewares/autorizacion.middleware';
import { validar } from '../middlewares/validacion.middleware';
import { esquemaMarcar, esquemaHacerTimbrar, esquemaColgar } from '../schemas/llamadas.schema';

const rutasLlamadas = Router();

// Todas las rutas de llamadas requieren token válido + rol ADMINISTRADOR o TECNICO.
rutasLlamadas.use(requiereAutenticacion);
rutasLlamadas.use(requiereRol('ADMINISTRADOR', 'TECNICO'));

// Rutas específicas antes que las paramétricas (convención del proyecto).
rutasLlamadas.get('/dispositivos', listarDispositivos);
rutasLlamadas.post('/marcar', validar(esquemaMarcar), marcar);
rutasLlamadas.post('/hacer-timbrar', validar(esquemaHacerTimbrar), hacerTimbrar);
rutasLlamadas.post('/colgar', validar(esquemaColgar), colgar);

export default rutasLlamadas;
