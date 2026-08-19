import type {
  DispositivoMonitoreable,
  EstadoMonitoreo,
} from '../repositories/monitoreo.repository';

export type { EstadoMonitoreo };

/** Estado en memoria de un dispositivo monitoreado. */
export interface EstadoDispositivo {
  id_telefono: number;
  mac: string | null; // necesaria para drift; null si no aplica
  tipo: 'IP_ATA' | 'IP_NATIVO';
  ip: string; // IP actual (puede cambiar por drift)
  estado: EstadoMonitoreo; // estado vigente
  fallos_consecutivos: number;
  fecha_ultima_conexion: Date | null;
}

/**
 * Guarda en memoria el estado vigente de cada dispositivo monitoreado.
 * No hace I/O ni dispara eventos: es solo el Map y su reconciliación.
 */
export class RegistroEstadoMonitoreo {
  private readonly dispositivos = new Map<number, EstadoDispositivo>();

  /**
   * Reconcilia el Map con la lista actual del inventario: agrega los nuevos
   * (DESCONOCIDO, 0 fallos), actualiza IP/MAC/tipo si cambiaron, conserva el
   * estado vivo de los existentes y quita los que ya no aparecen en la lista.
   */
  sincronizar(dispositivos: DispositivoMonitoreable[]): void {
    const idsVigentes = new Set<number>();

    for (const dispositivo of dispositivos) {
      idsVigentes.add(dispositivo.id_telefono);
      const existente = this.dispositivos.get(dispositivo.id_telefono);

      if (existente) {
        existente.ip = dispositivo.ip;
        existente.mac = dispositivo.mac;
        existente.tipo = dispositivo.tipo;
      } else {
        this.dispositivos.set(dispositivo.id_telefono, {
          id_telefono: dispositivo.id_telefono,
          mac: dispositivo.mac,
          tipo: dispositivo.tipo,
          ip: dispositivo.ip,
          estado: 'DESCONOCIDO',
          fallos_consecutivos: 0,
          fecha_ultima_conexion: null,
        });
      }
    }

    for (const idExistente of this.dispositivos.keys()) {
      if (!idsVigentes.has(idExistente)) {
        this.dispositivos.delete(idExistente);
      }
    }
  }

  obtenerTodos(): EstadoDispositivo[] {
    return [...this.dispositivos.values()];
  }

  obtener(idTelefono: number): EstadoDispositivo | undefined {
    return this.dispositivos.get(idTelefono);
  }
}
