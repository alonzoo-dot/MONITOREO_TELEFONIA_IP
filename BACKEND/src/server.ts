import { crearAplicacion } from './app';
import { configuracion } from './config/env';
import { probarConexion } from './config/database';

async function iniciarServidor(): Promise<void> {
  await probarConexion();

  const aplicacion = crearAplicacion();
  aplicacion.listen(configuracion.puerto, () => {
    console.log(
      `HotelWatch backend en http://localhost:${configuracion.puerto} (${configuracion.entorno})`,
    );
  });
}

iniciarServidor().catch((error: unknown) => {
  console.error('Fallo al iniciar el servidor:', error);
  process.exit(1);
});