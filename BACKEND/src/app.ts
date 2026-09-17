import path from 'path';
import fs from 'fs';
import express, { type Application, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import rutasAuth from './routes/auth.routes';
import rutasSetup from './routes/setup.routes';
import rutasUsuarios from './routes/usuarios.routes';
import rutasInventario from './routes/inventario.routes';
import rutasCatalogos from './routes/catalogos.routes';
import rutasMonitoreo from './routes/monitoreo.routes';
import rutasIncidencias from './routes/incidencias.routes';
import rutasEstadisticas from './routes/estadisticas.routes';
import rutasLlamadas from './routes/llamadas.routes';

export function crearAplicacion(): Application {
  const aplicacion = express();

  // Permitir peticiones desde el frontend
  aplicacion.use(cors({ origin: 'http://localhost:5173' }));

  aplicacion.use(express.json());

  aplicacion.get('/health', (_peticion: Request, respuesta: Response) => {
    respuesta.json({ estado: 'ok', servicio: 'monitoreo-backend' });
  });

  // Rutas de autenticación
  // Configuracion inicial: publica y solo operativa mientras no exista ningun usuario
  aplicacion.use('/api/setup', rutasSetup);

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

  // Rutas de estadisticas (tendencia, resumen, foto actual de la red)
  aplicacion.use('/api/estadisticas', rutasEstadisticas);

  // Rutas de llamadas (marcar, hacer timbrar, panel de dispositivos)
  aplicacion.use('/api/llamadas', rutasLlamadas);

  // --- Servido del frontend compilado (despliegue en una sola PC) ---
  // Si existe la carpeta con el build del frontend, Express la sirve en el MISMO
  // origen que el API. Frontend y backend comparten host y puerto: no hay CORS que
  // configurar y la IP del host no queda 'horneada' en el frontend (usa rutas /api
  // relativas). En desarrollo esta carpeta no existe (se usa Vite) y el bloque se omite.
  const rutaFrontend = path.resolve(__dirname, '..', 'frontend-dist');
  if (fs.existsSync(rutaFrontend)) {
    aplicacion.use(express.static(rutaFrontend));

    // Fallback SPA: todo GET que NO sea del API devuelve index.html, para que el
    // enrutamiento de React (rutas profundas y recargar la pagina) funcione.
    aplicacion.use((peticion: Request, respuesta: Response, siguiente: NextFunction) => {
      if (peticion.method !== 'GET') return siguiente();
      if (peticion.path.startsWith('/api')) return siguiente();
      respuesta.sendFile(path.join(rutaFrontend, 'index.html'));
    });
  }

  return aplicacion;
}