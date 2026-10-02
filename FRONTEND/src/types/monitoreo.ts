import type { AccionLlamada } from './llamada';

export type TipoDispositivoMonitoreo = 'IP_ATA' | 'IP_NATIVO';

export type EstadoDispositivoMonitoreo = 'ONLINE' | 'OFFLINE' | 'DESCONOCIDO' | 'EN_MANTENIMIENTO';

/** Snapshot de un dispositivo tal como lo reporta el motor de monitoreo (sin datos de inventario). */
export interface EstadoDispositivo {
  id_telefono: number;
  mac: string | null;
  tipo: TipoDispositivoMonitoreo;
  ip: string;
  estado: EstadoDispositivoMonitoreo;
  fallos_consecutivos: number;
  fecha_ultima_conexion: string | null;
}

/** Estado del motor enriquecido con los datos de inventario que el dashboard necesita mostrar. */
export interface DispositivoConEstado extends EstadoDispositivo {
  extension: string;
  ubicacion_nombre: string;
  accion?: AccionLlamada;
  motivo?: string;
}

export interface PayloadCambioEstado {
  id_telefono: number;
  estado_anterior: EstadoDispositivoMonitoreo;
  estado_nuevo: EstadoDispositivoMonitoreo;
  ip_registrada: string | null;
  fecha_ultima_conexion: string | null;
}

export interface PayloadDriftCorregido {
  id_telefono: number;
  tipo: TipoDispositivoMonitoreo;
  ip_anterior: string;
  ip_nueva: string;
}

export interface PayloadDispositivoEliminado {
  id_telefono: number;
}

export type EventoMonitoreo =
  | { tipo: 'cambio-estado'; payload: PayloadCambioEstado }
  | { tipo: 'drift-corregido'; payload: PayloadDriftCorregido }
  | { tipo: 'dispositivo-eliminado'; payload: PayloadDispositivoEliminado };

export type EstadoConexionSSE = 'conectando' | 'conectado' | 'reconectando' | 'expirado';
