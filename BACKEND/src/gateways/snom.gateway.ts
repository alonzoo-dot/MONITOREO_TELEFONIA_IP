import { configuracion } from '../config/env';
import type { LlamadaGateway, ParametrosLlamada, ResultadoLlamada } from './llamada.gateway';
import { ErrorLlamadas } from './errores';

const TIMEOUT_MS = 3000;

// Marca por HTTP contra la interfaz web de administracion del telefono Snom.
export class SnomGateway implements LlamadaGateway {
  async ejecutar({ ip, extensionDestino }: ParametrosLlamada): Promise<ResultadoLlamada> {
    if (!ip || !extensionDestino) {
      throw new ErrorLlamadas('PARAMETROS_INVALIDOS', 'Se requiere ip y extensionDestino.');
    }

    const numeroSanitizado = encodeURIComponent(extensionDestino);
    const url = `http://${ip}/command.htm?number=${numeroSanitizado}`;
    const credenciales = Buffer.from(
      `${configuracion.snomUsuario}:${configuracion.snomPassword}`,
    ).toString('base64');

    try {
      const respuesta = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${credenciales}`,
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (respuesta.ok) {
        return { exito: true, detalle: 'Marcado ejecutado correctamente.' };
      }

      if (respuesta.status === 401) {
        return { exito: false, detalle: 'Credenciales invalidas para el telefono Snom.' };
      }

      return { exito: false, detalle: `El telefono respondio con estado ${respuesta.status}.` };
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        return { exito: false, detalle: 'El telefono no respondio dentro del tiempo esperado.' };
      }
      const mensaje = error instanceof Error ? error.message : 'Error desconocido.';
      return { exito: false, detalle: `No se pudo contactar al telefono: ${mensaje}` };
    }
  }
}
