import { peticionApi } from './api';
import { obtenerToken } from './sesion';
import { listarDispositivos } from './inventario.service';
import { listarDispositivos as listarDispositivosLlamables } from './llamadas.service';
import type { EstadoDispositivo, DispositivoConEstado } from '../types/monitoreo';
import type { DispositivoLlamable } from '../types/llamada';

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

/** Pone un dispositivo en mantenimiento: el motor dejará de pinguearlo. */
export function activarMantenimiento(idTelefono: number): Promise<void> {
  return peticionApi<void>(`/monitoreo/${idTelefono}/mantenimiento/activar`, {
    metodo: 'PATCH',
    token: obtenerToken() ?? undefined,
  });
}

/** Saca un dispositivo de mantenimiento: el motor volverá a evaluarlo. */
export function desactivarMantenimiento(idTelefono: number): Promise<void> {
  return peticionApi<void>(`/monitoreo/${idTelefono}/mantenimiento/desactivar`, {
    metodo: 'PATCH',
    token: obtenerToken() ?? undefined,
  });
}

/** Combina el estado del motor con el inventario (extensión, ubicación) para la tabla del dashboard.
 *  Los dispositivos que no aparecen en ambas fuentes a la vez (p.ej. analógicos, no monitoreados) se ignoran.
 *  Tambien enriquece con la accion de llamada (/llamadas/dispositivos); si esa llamada falla, el
 *  dashboard sigue cargando con accion/motivo sin definir, porque el monitoreo es lo critico. */
export async function obtenerDashboard(): Promise<DispositivoConEstado[]> {
  const [estado, dispositivos, llamables] = await Promise.all([
    obtenerEstado(),
    listarDispositivos(),
    listarDispositivosLlamables().catch(() => [] as DispositivoLlamable[]),
  ]);

  const inventarioPorId = new Map(dispositivos.map((d) => [d.id_telefono, d]));
  const llamablePorId = new Map(llamables.map((d) => [d.id_telefono, d]));

  const resultado: DispositivoConEstado[] = [];
  for (const e of estado) {
    const inventario = inventarioPorId.get(e.id_telefono);
    if (!inventario) continue;
    const llamable = llamablePorId.get(e.id_telefono);
    resultado.push({
      ...e,
      extension: inventario.extension,
      ubicacion_nombre: inventario.ubicacion_nombre,
      accion: llamable?.accion,
      motivo: llamable?.motivo,
    });
  }
  return resultado;
}
