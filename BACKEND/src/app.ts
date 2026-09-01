import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import rutasAuth from './routes/auth.routes';
import rutasUsuarios from './routes/usuarios.routes';
import rutasInventario from './routes/inventario.routes';
import rutasCatalogos from './routes/catalogos.routes';
import rutasMonitoreo from './routes/monitoreo.routes';
import rutasIncidencias from './routes/incidencias.routes';

export function crearAplicacion(): Application {
  const aplicacion = express();

  // Permitir peticiones desde el frontend
  aplicacion.use(cors({ origin: 'http://localhost:5173' }));

  aplicacion.use(express.json());

  aplicacion.get('/health', (_peticion: Request, respuesta: Response) => {
    respuesta.json({ estado: 'ok', servicio: 'monitoreo-backend' });
  });

  // Rutas de autenticación
  aplicacion.use('/api/auth', rutasAuth);

  // Rutas de gestión de usuarios
  aplicacion.use('/api/usuarios', rutasUsuarios);

  // Rutas de inventario (dispositivos)
  aplicacion.use('/api/dispositivos', rutasInventario);

  // Rutas de catálogos (modelos y departamentos)
  aplicacion.use('/api/catalogos', rutasCatalogos);

  // Rutas de monitoreo (estado en vivo, stream SSE, incidencias pendientes)
  aplicacion.use('/api/monitoreo', rutasMonitoreo);

   // Rutas de incidencias (historial, atender, conteo de pendientes)
  aplicacion.use('/api/incidencias', rutasIncidencias);

  return aplicacion;
}