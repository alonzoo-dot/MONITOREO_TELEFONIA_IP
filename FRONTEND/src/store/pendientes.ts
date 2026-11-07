import { obtenerConteoPendientes } from '../services/incidencias.service';

type Escucha = (valor: number) => void;

/** Espera tras el ultimo evento SSE antes de pedir el conteo al backend. */
const ESPERA_SINCRONIZACION_MS = 500;

let valor = 0;
let cargado = false;
let temporizadorSincronizacion: ReturnType<typeof setTimeout> | null = null;
let ultimaSincronizacion = 0;
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

/** Vuelve a pedir el conteo al backend. Agrupa las rafagas de eventos SSE en una sola
 *  peticion (al arrancar el motor llega un evento por cada telefono) y descarta
 *  respuestas viejas. Si falla conserva el valor actual: el siguiente evento reintenta. */
export function sincronizarPendientes(): void {
  if (temporizadorSincronizacion !== null) clearTimeout(temporizadorSincronizacion);

  temporizadorSincronizacion = setTimeout(() => {
    temporizadorSincronizacion = null;
    ultimaSincronizacion += 1;
    const sincronizacion = ultimaSincronizacion;

    obtenerConteoPendientes()
      .then((n) => {
        if (sincronizacion === ultimaSincronizacion) establecerPendientes(n);
      })
      .catch(() => {});
  }, ESPERA_SINCRONIZACION_MS);
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
