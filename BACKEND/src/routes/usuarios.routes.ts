import { Router } from 'express';
import { crear, listar, editar, resetear } from '../controllers/usuarios.controller';
import { requiereAutenticacion } from '../middlewares/auth.middleware';
import { requiereRol } from '../middlewares/autorizacion.middleware';

const rutasUsuarios = Router();

// Todas las rutas de usuarios requieren: token válido + rol ADMINISTRADOR
rutasUsuarios.use(requiereAutenticacion);
rutasUsuarios.use(requiereRol('ADMINISTRADOR'));

rutasUsuarios.get('/', listar);
rutasUsuarios.post('/', crear);
rutasUsuarios.put('/:id', editar);
rutasUsuarios.post('/:id/reset-password', resetear);

export default rutasUsuarios;