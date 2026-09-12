import { peticionApi } from './api';
import { obtenerToken } from './sesion';
import type { DispositivoLlamable, ResultadoLlamada } from '../types/llamada';

// Lista los dispositivos activos con la accion de llamada que admite cada uno.
export async function listarDispositivos(): Promise<DispositivoLlamable[]> {
  return peticionApi<DispositivoLlamable[]>('/llamadas/dispositivos', {
    token: obtenerToken() ?? undefined,
  });
}

// Marca desde un telefono IP nativo hacia una extension destino.
// El backend responde 200 con { exito, detalle } incluso si la llamada no se
// concreto; peticionApi solo lanza ErrorApi en 4xx/5xx, asi que ese resultado
// se devuelve tal cual, sin tratarlo como error.
export async function marcar(
  idOrigen: number,
  extensionDestino: string,
): Promise<ResultadoLlamada> {
  return peticionApi<ResultadoLlamada>('/llamadas/marcar', {
    metodo: 'POST',
    cuerpo: { idOrigen, extensionDestino },
    token: obtenerToken() ?? undefined,
  });
}

// Cuelga (RELEASE_ALL_CALLS) el telefono IP nativo que marco, identificado por
// el mismo idOrigen que se uso al marcar.
export async function colgarMarcado(idTelefono: number): Promise<ResultadoLlamada> {
  return peticionApi<ResultadoLlamada>('/llamadas/colgar-marcado', {
    metodo: 'POST',
    cuerpo: { idTelefono },
    token: obtenerToken() ?? undefined,
  });
}

// Hace timbrar un telefono via softphone SIP, registrandose con una extension
// y credenciales propias. Mismo tratamiento de exito:false que marcar().
export async function hacerTimbrar(
  extensionOrigen: string,
  usuarioSip: string,
  passwordSip: string,
  extensionDestino: string,
): Promise<ResultadoLlamada> {
  return peticionApi<ResultadoLlamada>('/llamadas/hacer-timbrar', {
    metodo: 'POST',
    cuerpo: { extensionOrigen, usuarioSip, passwordSip, extensionDestino },
    token: obtenerToken() ?? undefined,
  });
}

// Cuelga (o cancela el timbrado de) una llamada iniciada con hacerTimbrar,
// identificada por el idSesion que devolvio esa llamada.
export async function colgarTimbrado(idSesion: string): Promise<ResultadoLlamada> {
  return peticionApi<ResultadoLlamada>('/llamadas/colgar', {
    metodo: 'POST',
    cuerpo: { idSesion },
    token: obtenerToken() ?? undefined,
  });
}
