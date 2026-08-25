import { ejecutarEnTransaccion } from '../config/database';
import * as monitoreoRepo from '../repositories/monitoreo.repository';
import type { EstadoMonitoreo } from '../repositories/monitoreo.repository';
import * as incidenciasRepo from '../repositories/incidencias.repository';
import type { TipoEvento } from '../repositories/incidencias.repository';
import * as mantenimientoLogRepo from '../repositories/mantenimiento_log.repository';
import type {
  MotorMonitoreo,
  PayloadCambioEstado,
  PayloadDriftCorregido,
} from '../motor/motorMonitoreo';
import type { EstadoDispositivo } from '../motor/estadoMonitoreo';
import * as eventosSse from './eventosSse.service';

/** Error de negocio del módulo de monitoreo, con un código para traducir a HTTP. */
export class ErrorMonitoreo extends Error {
  constructor(
    public readonly codigo: string,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorMonitoreo';
  }
}

/** Motor al que este servicio quedó suscrito (null si el motor está inactivo). */
let motorSuscrito: MotorMonitoreo | null = null;

/**
 * Suscribe el servicio a los eventos del motor. Se llama una sola vez al
 * arrancar el backend, si MOTOR_ACTIVO=true.
 */
export function suscribirAlMotor(motor: MotorMonitoreo): void {
  motorSuscrito = motor;
  motor.on('cambio-estado', (payload) => {
    void manejarCambioEstado(payload);
  });
  motor.on('drift-corregido', manejarDriftCorregido);
}

/** Decide si una transición de estado corresponde a una incidencia, y de qué tipo. */
function determinarTipoEvento(
  estadoAnterior: EstadoMonitoreo,
  estadoNuevo: EstadoMonitoreo,
): TipoEvento | null {
  if (estadoNuevo === 'OFFLINE') return 'CAIDA';
  if (estadoNuevo === 'ONLINE' && estadoAnterior === 'OFFLINE') return 'RECUPERACION';
  return null;
}

/** Persiste un cambio de estado (fila de monitoreo + incidencia, si aplica) y notifica por SSE. */
async function manejarCambioEstado(payload: PayloadCambioEstado): Promise<void> {
  const { id_telefono, estado_anterior, estado_nuevo, ip_registrada, fecha_ultima_conexion } =
    payload;

  try {
    await ejecutarEnTransaccion(async (cliente) => {
      await monitoreoRepo.crearFilaMonitoreo(id_telefono, cliente);
      await monitoreoRepo.actualizarEstado(id_telefono, estado_nuevo, fecha_ultima_conexion, cliente);

      const tipoEvento = determinarTipoEvento(estado_anterior, estado_nuevo);
      if (tipoEvento) {
        await incidenciasRepo.insertarIncidencia(
          { id_telefono, tipo_evento: tipoEvento, ip_registrada, descripcion_falla: null },
          cliente,
        );
      }
    });
  } catch (error) {
    console.error('[MONITOREO] Error al persistir el cambio de estado:', error);
    return; // no se notifica por SSE si no quedó registrado
  }

  eventosSse.difundir('cambio-estado', payload);
}

/** El drift ya fue persistido por el motor (actualizarIpDispositivo); aquí solo se notifica. */
function manejarDriftCorregido(payload: PayloadDriftCorregido): void {
  eventosSse.difundir('drift-corregido', payload);
}

/** Snapshot del estado en memoria del motor. [] si el motor no está activo. */
export function obtenerEstadoActual(): EstadoDispositivo[] {
  return motorSuscrito ? motorSuscrito.obtenerEstado() : [];
}

/** Cantidad de incidencias sin atender. */
export async function obtenerConteoPendientes(): Promise<number> {
  return incidenciasRepo.contarPendientes();
}

/** Pone un dispositivo en mantenimiento: el motor lo saltará hasta que se reactive. */
export async function activarMantenimiento(idTelefono: number, idUsuario: number): Promise<void> {
  const estadoAnterior = await ejecutarEnTransaccion(async (cliente) => {
    const dispositivo = await monitoreoRepo.buscarMonitoreablePorId(idTelefono, cliente);
    if (!dispositivo) {
      throw new ErrorMonitoreo('NO_ENCONTRADO', 'El dispositivo no existe o no es monitoreable.');
    }
    if (dispositivo.estado === 'EN_MANTENIMIENTO') {
      throw new ErrorMonitoreo('YA_EN_MANTENIMIENTO', 'El dispositivo ya está en mantenimiento.');
    }

    await monitoreoRepo.crearFilaMonitoreo(idTelefono, cliente);
    await monitoreoRepo.ponerEnMantenimiento(idTelefono, cliente);
    await mantenimientoLogRepo.insertarLog(
      { id_telefono: idTelefono, id_usuario: idUsuario, accion: 'ACTIVAR' },
      cliente,
    );

    return dispositivo.estado;
  });

  eventosSse.difundir('cambio-estado', {
    id_telefono: idTelefono,
    estado_anterior: estadoAnterior,
    estado_nuevo: 'EN_MANTENIMIENTO',
    ip_registrada: null,
    fecha_ultima_conexion: null,
  });
}

/** Saca un dispositivo de mantenimiento; queda DESCONOCIDO hasta que el motor lo reevalúe. */
export async function desactivarMantenimiento(
  idTelefono: number,
  idUsuario: number,
): Promise<void> {
  await ejecutarEnTransaccion(async (cliente) => {
    const dispositivo = await monitoreoRepo.buscarMonitoreablePorId(idTelefono, cliente);
    if (!dispositivo) {
      throw new ErrorMonitoreo('NO_ENCONTRADO', 'El dispositivo no existe o no es monitoreable.');
    }
    if (dispositivo.estado !== 'EN_MANTENIMIENTO') {
      throw new ErrorMonitoreo('NO_EN_MANTENIMIENTO', 'El dispositivo no está en mantenimiento.');
    }

    await monitoreoRepo.quitarDeMantenimiento(idTelefono, cliente);
    await mantenimientoLogRepo.insertarLog(
      { id_telefono: idTelefono, id_usuario: idUsuario, accion: 'DESACTIVAR' },
      cliente,
    );
  });

  eventosSse.difundir('cambio-estado', {
    id_telefono: idTelefono,
    estado_anterior: 'EN_MANTENIMIENTO',
    estado_nuevo: 'DESCONOCIDO',
    ip_registrada: null,
    fecha_ultima_conexion: null,
  });
}
