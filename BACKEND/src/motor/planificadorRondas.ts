/**
 * Bucle temporal que dispara rondas de monitoreo cada `intervaloMs`.
 * Si una ronda todavía está corriendo cuando llega el siguiente tick, lo omite
 * (no encola) para evitar solapamiento si alguna ronda se cuelga.
 */
export class PlanificadorRondas {
  private idIntervalo: ReturnType<typeof setInterval> | null = null;
  private enEjecucion = false;

  constructor(
    private readonly intervaloMs: number,
    private readonly alTickearRonda: () => Promise<void>,
  ) {}

  iniciar(): void {
    this.idIntervalo = setInterval(() => {
      void this.tick();
    }, this.intervaloMs);
  }

  detener(): void {
    if (this.idIntervalo !== null) {
      clearInterval(this.idIntervalo);
      this.idIntervalo = null;
    }
  }

  private async tick(): Promise<void> {
    if (this.enEjecucion) {
      console.warn('[MOTOR] La ronda anterior aún no termina; se omite este tick.');
      return;
    }

    this.enEjecucion = true;
    try {
      await this.alTickearRonda();
    } catch (error) {
      // Red de seguridad: una ronda nunca debe tumbar el proceso. Si algo falla
      // (p. ej. la BD no responde), se registra y el planificador sigue con el
      // siguiente tick, en vez de dejar una promesa rechazada sin manejar.
      console.error('[MOTOR] Error no controlado durante la ronda de monitoreo:', error);
    } finally {
      this.enEjecucion = false;
    }
  }
}
