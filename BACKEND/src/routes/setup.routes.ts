import { Router } from 'express';
import { estado, configurar } from '../controllers/setup.controller';
import { validar } from '../middlewares/validacion.middleware';
import { esquemaSetup } from '../schemas/setup.schema';

const rutasSetup = Router();

// Rutas publicas a proposito: se usan cuando todavia no existe ningun usuario.
// El service rechaza la creacion si ya hay al menos un usuario en el sistema.
rutasSetup.get('/estado', estado);
rutasSetup.post('/', validar(esquemaSetup), configurar);

export default rutasSetup;
