import { peticionApi } from './api';
import { obtenerToken } from './sesion';
import { listarDispositivos } from './inventario.service';
import type { EstadoDispositivo, DispositivoConEstado } from '../types/monitoreo';

/** Estado actual de todos los dispositivos monitoreados, tal como lo ve el motor. */
export function obtenerEstado(): Promise<EstadoDispositivo[]> {
  return peticionApi<EstadoDispositivo[]>('/monitoreo/estado', {
    token: obtenerToken() ?? undefined,
  });
}

/** Cantidad de incidencias pendientes por atender. */
export async function obtenerPendientes(): Promise<number> {
  const respuesta = await peticionApi<{ pendientes: number }>('/monitoreo/pendientes', {
    token: obtenerToken() ?? undefined,
  });
  return respuesta.pendientes;
}

/** Combina el estado del motor con el inventario (extensión, ubicación) para la tabla del dashboard.
 *  Los dispositivos que no aparecen en ambas fuentes a la vez (p.ej. analógicos, no monitoreados) se ignoran. */
export async function obtenerDashboard(): Promise<DispositivoConEstado[]> {
  const [estado, dispositivos] = await Promise.all([obtenerEstado(), listarDispositivos()]);

  const inventarioPorId = new Map(dispositivos.map((d) => [d.id_telefono, d]));

  const resultado: DispositivoConEstado[] = [];
  for (const e of estado) {
    const inventario = inventarioPorId.get(e.id_telefono);
    if (!inventario) continue;
    resultado.push({
      ...e,
      extension: inventario.extension,
      ubicacion_nombre: inventario.ubicacion_nombre,
    });
  }
  return resultado;
}
