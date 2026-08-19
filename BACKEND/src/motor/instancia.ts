import type { MotorMonitoreo } from './motorMonitoreo';

/**
 * Instancia global del motor de monitoreo, para que otros módulos (Paso 5) se
 * suscriban a sus eventos. Null mientras MOTOR_ACTIVO=false o antes del arranque.
 */
export let instanciaMotor: MotorMonitoreo | null = null;

/** Usado por el arranque del servidor para publicar la instancia ya iniciada. */
export function establecerInstanciaMotor(motor: MotorMonitoreo): void {
  instanciaMotor = motor;
}
