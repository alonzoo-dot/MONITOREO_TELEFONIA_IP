import { configuracion } from '../config/env';
import type { LlamadaGateway, ParametrosLlamada, ResultadoLlamada } from './llamada.gateway';
import { ErrorLlamadas } from './errores';

const TIMEOUT_MS = 3000;

// Marca por HTTP contra la Action URI del telefono Yealink (servlet).
// IMPORTANTE: NO usar outgoing_uri; en el firmware de los telefonos del hotel
// ese parametro rompe el marcado. Comprobado manualmente: solo funciona
// http://<ip>/servlet?number=<destino>.
export class YealinkGateway implements LlamadaGateway {
  async ejecutar({ ip, extensionDestino }: ParametrosLlamada): Promise<ResultadoLlamada> {
    if (!ip || !extensionDestino) {
      throw new ErrorLlamadas('PARAMETROS_INVALIDOS', 'Se requiere ip y extensionDestino.');
    }

    const numeroSanitizado = encodeURIComponent(extensionDestino);
    return comandoHttp(ip, `number=${numeroSanitizado}`, 'Marcado ejecutado correctamente.');
  }
}

// GET autenticado (HTTP Basic, credenciales admin propias) contra el servlet del Yealink.
// Nunca lanza: cualquier error de red/timeout se traduce a un ResultadoLlamada con exito:false.
async function comandoHttp(ip: string, query: string, detalleExito: string): Promise<ResultadoLlamada> {
  const url = `http://${ip}/servlet?${query}`;
  const credenciales = Buffer.from(
    `${configuracion.yealinkUsuario}:${configuracion.yealinkPassword}`,
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
      return { exito: false, detalle: 'Credenciales invalidas para el telefono Yealink.' };
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
