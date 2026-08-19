import { EventEmitter } from 'events';
import type { ResolvedorIp } from './resolvedorIp';
import type {
  DispositivoMonitoreable,
  EstadoMonitoreo as TipoEstadoMonitoreo,
} from '../repositories/monitoreo.repository';
import { RegistroEstadoMonitoreo, type EstadoDispositivo } from './estadoMonitoreo';
import { PlanificadorRondas } from './planificadorRondas';
import { ejecutarPing } from './ejecutorPing';

/** Lo que el motor necesita del repositorio de monitoreo (Paso 3). */
export interface RepositorioMonitoreo {
  listarDispositivosMonitoreables(): Promise<DispositivoMonitoreable[]>;
  actualizarIpDispositivo(
    idTelefono: number,
    tipo: 'IP_ATA' | 'IP_NATIVO',
    nuevaIp: string,
  ): Promise<void>;
}

/** Parámetros configurables del motor; todos tienen default. */
export interface ConfigMotor {
  intervaloRondaMs?: number;
  umbralFallos?: number;
  tamanoLote?: number;
  timeoutPingMs?: number;
  rondasEntreRefrescos?: number;
}

const CONFIG_DEFECTO: Required<ConfigMotor> = {
  intervaloRondaMs: 60_000,
  umbralFallos: 3,
  tamanoLote: 20,
  timeoutPingMs: 1000,
  rondasEntreRefrescos: 5,
};

/** Payload del evento 'cambio-estado'. */
export interface PayloadCambioEstado {
  id_telefono: number;
  estado_anterior: TipoEstadoMonitoreo;
  estado_nuevo: TipoEstadoMonitoreo;
  ip_registrada: string;
  fecha_ultima_conexion: Date | null;
}

/** Payload del evento 'drift-corregido'. */
export interface PayloadDriftCorregido {
  id_telefono: number;
  tipo: 'IP_ATA' | 'IP_NATIVO';
  ip_anterior: string;
  ip_nueva: string;
}

/**
 * Orquesta el ciclo de monitoreo ICMP: pinguea por lotes, decide transiciones
 * de estado y corrige drift de IP antes de declarar una caída. No persiste en
 * BD (salvo la corrección de drift) ni notifica al frontend — eso es el Paso 5,
 * que se suscribe a los eventos emitidos aquí.
 */
export class MotorMonitoreo {
  private readonly config: Required<ConfigMotor>;
  private readonly estado = new RegistroEstadoMonitoreo();
  private readonly planificador: PlanificadorRondas;
  private readonly emisor = new EventEmitter();
  private rondasDesdeUltimoRefresco = 0;

  constructor(
    private readonly resolvedor: ResolvedorIp,
    private readonly repositorioMonitoreo: RepositorioMonitoreo,
    config: ConfigMotor = {},
  ) {
    this.config = { ...CONFIG_DEFECTO, ...config };
    this.planificador = new PlanificadorRondas(this.config.intervaloRondaMs, () =>
      this.ejecutarRonda(),
    );
  }

  /** Carga inicial de dispositivos y arranca el planificador de rondas. */
  async iniciar(): Promise<void> {
    await this.refrescarLista();
    this.planificador.iniciar();
  }

  /** Detiene el planificador. El estado en memoria queda intacto. */
  detener(): void {
    this.planificador.detener();
  }

  /** Lectura del estado actual, para el endpoint que expondrá el Paso 5. */
  obtenerEstado(): EstadoDispositivo[] {
    return this.estado.obtenerTodos();
  }

  on(evento: 'cambio-estado', callback: (payload: PayloadCambioEstado) => void): void;
  on(evento: 'drift-corregido', callback: (payload: PayloadDriftCorregido) => void): void;
  on(evento: string, callback: (...args: any[]) => void): void {
    this.emisor.on(evento, callback);
  }

  off(evento: 'cambio-estado', callback: (payload: PayloadCambioEstado) => void): void;
  off(evento: 'drift-corregido', callback: (payload: PayloadDriftCorregido) => void): void;
  off(evento: string, callback: (...args: any[]) => void): void {
    this.emisor.off(evento, callback);
  }

  /** Una ronda: refresca la lista cada N rondas, pinguea por lotes y decide transiciones. */
  private async ejecutarRonda(): Promise<void> {
    this.rondasDesdeUltimoRefresco += 1;
    if (this.rondasDesdeUltimoRefresco >= this.config.rondasEntreRefrescos) {
      await this.refrescarLista();
      this.rondasDesdeUltimoRefresco = 0;
    }

    const dispositivos = this.estado
      .obtenerTodos()
      .filter((dispositivo) => dispositivo.estado !== 'EN_MANTENIMIENTO');

    for (let inicio = 0; inicio < dispositivos.length; inicio += this.config.tamanoLote) {
      const lote = dispositivos.slice(inicio, inicio + this.config.tamanoLote);
      await Promise.all(
        lote.map(async (dispositivo) => {
          const ok = await ejecutarPing(dispositivo.ip, this.config.timeoutPingMs);
          await this.procesarResultadoPing(dispositivo, ok);
        }),
      );
    }
  }

  /** Decide la transición de estado (o corrección de drift) para un dispositivo. */
  private async procesarResultadoPing(dispositivo: EstadoDispositivo, ok: boolean): Promise<void> {
    if (ok) {
      const fecha = new Date();
      const estadoAnterior = dispositivo.estado;

      dispositivo.fallos_consecutivos = 0;
      dispositivo.fecha_ultima_conexion = fecha;

      if (estadoAnterior === 'OFFLINE' || estadoAnterior === 'DESCONOCIDO') {
        dispositivo.estado = 'ONLINE';
        this.emisor.emit('cambio-estado', {
          id_telefono: dispositivo.id_telefono,
          estado_anterior: estadoAnterior,
          estado_nuevo: 'ONLINE',
          ip_registrada: dispositivo.ip,
          fecha_ultima_conexion: fecha,
        } satisfies PayloadCambioEstado);
      }
      return;
    }

    dispositivo.fallos_consecutivos += 1;

    if (dispositivo.fallos_consecutivos < this.config.umbralFallos) {
      return;
    }

    if (dispositivo.fallos_consecutivos > this.config.umbralFallos) {
      // Ya está OFFLINE (o el drift lo hubiera reseteado a 0): no hay nada que emitir.
      return;
    }

    // fallos_consecutivos === umbralFallos: recién se cruza el umbral.
    if (dispositivo.estado === 'OFFLINE') {
      return;
    }

    const huboDrift = await this.intentarCorregirDrift(dispositivo);
    if (huboDrift) {
      return;
    }

    const estadoAnterior = dispositivo.estado;
    dispositivo.estado = 'OFFLINE';
    this.emisor.emit('cambio-estado', {
      id_telefono: dispositivo.id_telefono,
      estado_anterior: estadoAnterior,
      estado_nuevo: 'OFFLINE',
      ip_registrada: dispositivo.ip,
      fecha_ultima_conexion: dispositivo.fecha_ultima_conexion,
    } satisfies PayloadCambioEstado);
  }

  /**
   * Intenta corregir drift de IP vía ARP antes de declarar la caída.
   * Devuelve true si corrigió (y por lo tanto no hay que pasar a OFFLINE todavía).
   */
  private async intentarCorregirDrift(dispositivo: EstadoDispositivo): Promise<boolean> {
    if (!dispositivo.mac) {
      return false;
    }

    const ipReal = await this.resolvedor.resolverIp(dispositivo.mac);
    if (ipReal === null || ipReal === dispositivo.ip) {
      return false;
    }

    const ipAnterior = dispositivo.ip;
    dispositivo.ip = ipReal;
    dispositivo.fallos_consecutivos = 0;

    await this.repositorioMonitoreo.actualizarIpDispositivo(
      dispositivo.id_telefono,
      dispositivo.tipo,
      ipReal,
    );

    this.emisor.emit('drift-corregido', {
      id_telefono: dispositivo.id_telefono,
      tipo: dispositivo.tipo,
      ip_anterior: ipAnterior,
      ip_nueva: ipReal,
    } satisfies PayloadDriftCorregido);

    return true;
  }

  /** Reconcilia el estado en memoria con el inventario. Un fallo aquí no detiene el motor. */
  private async refrescarLista(): Promise<void> {
    try {
      const dispositivos = await this.repositorioMonitoreo.listarDispositivosMonitoreables();
      this.estado.sincronizar(dispositivos);
    } catch (error) {
      console.error('[MOTOR] Error al refrescar la lista de dispositivos monitoreables:', error);
    }
  }
}
