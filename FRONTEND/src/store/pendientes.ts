import { obtenerConteoPendientes } from '../services/incidencias.service';

type Escucha = (valor: number) => void;

let valor = 0;
let cargado = false;
const escuchas = new Set<Escucha>();

function notificar(): void {
  escuchas.forEach((fn) => fn(valor));
}

/** Se suscribe a cambios en el conteo de pendientes. Devuelve la función para desuscribirse. */
export function suscribirPendientes(fn: Escucha): () => void {
  escuchas.add(fn);
  fn(valor);
  return () => {
    escuchas.delete(fn);
  };
}

export function establecerPendientes(n: number): void {
  valor = n;
  cargado = true;
  notificar();
}

export function incrementarPendientes(): void {
  valor += 1;
  notificar();
}

// Baja el conteo en uno sin dejar que sea negativo. La usa la pantalla al atender.
export function decrementarPendientes(): void {
  valor = Math.max(0, valor - 1);
  notificar();
}

/** Pide el conteo inicial al backend, una sola vez por sesión de la app.
 *  Llamadas repetidas (p.ej. al navegar entre páginas) no repiten la petición. */
export function cargarPendientesInicial(): void {
  if (cargado) return;
  cargado = true;

  obtenerConteoPendientes()
    .then((n) => {
      valor = n;
      notificar();
    })
    .catch(() => {
      cargado = false;
    });
}
