import type { ConfirmacionPendiente, OpcionesConfirmacion } from '../types/confirmacion';
import { generarId } from '../utils/id';

type Escucha = (confirmacion: ConfirmacionPendiente | null) => void;

let confirmacionActual: ConfirmacionPendiente | null = null;
let resolverActual: ((valor: boolean) => void) | null = null;
const escuchas = new Set<Escucha>();

function notificar(): void {
  escuchas.forEach((fn) => fn(confirmacionActual));
}

/** Se suscribe a la confirmacion pendiente. Devuelve la funcion para desuscribirse. */
export function suscribirConfirmacion(fn: Escucha): () => void {
  escuchas.add(fn);
  fn(confirmacionActual);
  return () => {
    escuchas.delete(fn);
  };
}

/** Pide confirmacion al usuario y resuelve true si acepta o false si cancela */
export function confirmar(opciones: OpcionesConfirmacion): Promise<boolean> {
  return new Promise((resolve) => {
    confirmacionActual = { id: generarId(), ...opciones };
    resolverActual = resolve;
    notificar();
  });
}

/** Resuelve la confirmacion pendiente con el valor indicado y limpia el estado */
function resolver(valor: boolean): void {
  const resolve = resolverActual;
  confirmacionActual = null;
  resolverActual = null;
  notificar();
  resolve?.(valor);
}

/** El usuario acepto la confirmacion pendiente */
export function aceptarConfirmacion(): void {
  resolver(true);
}

/** El usuario cancelo la confirmacion pendiente */
export function cancelarConfirmacion(): void {
  resolver(false);
}
