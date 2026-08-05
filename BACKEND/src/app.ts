import express, { type Application, type Request, type Response } from 'express';
import rutasAuth from './routes/auth.routes';

export function crearAplicacion(): Application {
  const aplicacion = express();

  aplicacion.use(express.json());

  aplicacion.get('/health', (_peticion: Request, respuesta: Response) => {
    respuesta.json({ estado: 'ok', servicio: 'hotelwatch-backend' });
  });

  // Rutas de autenticación, todas bajo el prefijo /api/auth
  aplicacion.use('/api/auth', rutasAuth);

  return aplicacion;
}