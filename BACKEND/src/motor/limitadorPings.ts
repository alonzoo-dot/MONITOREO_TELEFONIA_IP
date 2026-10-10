import { configuracion } from '../config/env';

const MAX_POR_DEFECTO = 50;

/**
 * Semaforo FIFO: limita cuantas tareas corren a la vez.
 * Las tareas que no consiguen lugar esperan en cola y se liberan en orden de llegada.
 */
export class LimitadorPings {
  private enCurso = 0;
  private cola: Array<() => void> = [];
  private readonly max: number;

  constructor(max: number) {
    this.max = Number.isFinite(max) && max > 0 ? Math.floor(max) : MAX_POR_DEFECTO;
  }

  async ejecutar<T>(tarea: () => Promise<T>): Promise<T> {
    await this.adquirir();
    try {
      return await tarea();
    } finally {
      this.liberar();
    }
  }

  private adquirir(): Promise<void> {
    if (this.enCurso < this.max) {
      this.enCurso++;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.cola.push(resolve);
    });
  }

  private liberar(): void {
    const siguiente = this.cola.shift();
    if (siguiente) {
      // El lugar pasa directo al siguiente de la cola, enCurso no cambia
      siguiente();
    } else {
      this.enCurso--;
    }
  }
}

export const limitadorPings = new LimitadorPings(configuracion.maxPingsConcurrentes);
