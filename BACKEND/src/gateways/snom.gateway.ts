import { configuracion } from '../config/env';
import type { LlamadaGateway, ParametrosLlamada, ResultadoLlamada } from './llamada.gateway';
import { ErrorLlamadas } from './errores';

const TIMEOUT_MS = 3000;

/** Parametros para colgar (RELEASE_ALL_CALLS) en un telefono Snom. */
export interface ParametrosColgarSnom {
  ip: string;
}

// Marca y cuelga por HTTP contra la interfaz web de administracion del telefono Snom.
export class SnomGateway implements LlamadaGateway {
  async ejecutar({ ip, extensionDestino }: ParametrosLlamada): Promise<ResultadoLlamada> {
    if (!ip || !extensionDestino) {
      throw new ErrorLlamadas('PARAMETROS_INVALIDOS', 'Se requiere ip y extensionDestino.');
    }

    const numeroSanitizado = encodeURIComponent(extensionDestino);
    return comandoHttp(ip, `number=${numeroSanitizado}`, 'Marcado ejecutado correctamente.');
  }

  // Cuelga todas las llamadas activas en el telefono, via RELEASE_ALL_CALLS.
  async colgar({ ip }: ParametrosColgarSnom): Promise<ResultadoLlamada> {
    if (!ip) {
      throw new ErrorLlamadas('PARAMETROS_INVALIDOS', 'Se requiere ip.');
    }

    return comandoHttp(ip, 'RELEASE_ALL_CALLS', 'Llamada colgada');
  }
}

// GET autenticado (HTTP Basic, credenciales admin) contra command.htm del Snom.
// Nunca lanza: cualquier error de red/timeout se traduce a un ResultadoLlamada con exito:false.
async function comandoHttp(ip: string, query: string, detalleExito: string): Promise<ResultadoLlamada> {
  const url = `http://${ip}/command.htm?${query}`;
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
      return { exito: true, detalle: detalleExito };
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
