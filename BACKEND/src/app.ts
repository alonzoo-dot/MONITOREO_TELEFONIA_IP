import express, { type Application, type Request, type Response } from 'express';

export function crearAplicacion(): Application {
  const aplicacion = express();

  aplicacion.use(express.json());

  aplicacion.get('/health', (_peticion: Request, respuesta: Response) => {
    respuesta.json({ estado: 'ok', servicio: 'hotelwatch-backend' });
  });

  return aplicacion;
}