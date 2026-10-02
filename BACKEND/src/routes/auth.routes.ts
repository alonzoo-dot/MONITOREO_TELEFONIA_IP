 import { Router } from 'express';
import { login, cambiarPasswordControlador } from '../controllers/auth.controller';
import { requiereAutenticacion } from '../middlewares/auth.middleware';
import { limitadorLogin } from '../middlewares/limitadorTasa.middleware';

const rutasAuth = Router();

// Ruta pública: cualquiera puede intentar iniciar sesión
rutasAuth.post('/login', limitadorLogin, login);

// Ruta protegida: requiere token válido para cambiar la contraseña
rutasAuth.post('/change-password', requiereAutenticacion, cambiarPasswordControlador);

export default rutasAuth;