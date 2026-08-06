import express, { type Application, type Request, type Response } from 'express';
import rutasAuth from './routes/auth.routes';
import rutasUsuarios from './routes/usuarios.routes';

export function crearAplicacion(): Application {
  const aplicacion = express();

  aplicacion.use(express.json());

  aplicacion.get('/health', (_peticion: Request, respuesta: Response) => {
    respuesta.json({ estado: 'ok', servicio: 'hotelwatch-backend' });
  });

  // Rutas de autenticación
  aplicacion.use('/api/auth', rutasAuth);

  // Rutas de gestión de usuarios
  aplicacion.use('/api/usuarios', rutasUsuarios);

  return aplicacion;
}