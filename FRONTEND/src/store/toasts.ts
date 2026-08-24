import type { DatosToast, ToastItem } from '../types/toast';

type Escucha = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const escuchas = new Set<Escucha>();

function notificar(): void {
  escuchas.forEach((fn) => fn(toasts));
}

/** Se suscribe a la lista de toasts activos. Devuelve la función para desuscribirse. */
export function suscribirToasts(fn: Escucha): () => void {
  escuchas.add(fn);
  fn(toasts);
  return () => {
    escuchas.delete(fn);
  };
}

/** Agrega un nuevo toast a la pila. */
export function mostrarToast(datos: DatosToast): void {
  const toast: ToastItem = { id: crypto.randomUUID(), autoCloseMs: 5000, ...datos };
  toasts = [...toasts, toast];
  notificar();
}

export function cerrarToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  notificar();
}
