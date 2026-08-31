import type { Response } from 'express';

/** Cada cuánto se manda un comentario SSE para evitar que un proxy cierre la conexión. */
const INTERVALO_KEEP_ALIVE_MS = 30_000;

/** Clientes conectados al stream de eventos de monitoreo. */
const clientes = new Set<Response>();

/** Temporizador de keep-alive de cada cliente, para poder cancelarlo al desconectar. */
const keepAlives = new Map<Response, ReturnType<typeof setInterval>>();

/** Registra un nuevo cliente SSE: prepara los headers y arranca su keep-alive. */
export function registrarCliente(respuesta: Response): void {
  respuesta.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  respuesta.write('event: conectado\ndata: {}\n\n');

  clientes.add(respuesta);
  keepAlives.set(
    respuesta,
    setInterval(() => {
      respuesta.write(': heartbeat\n\n');
    }, INTERVALO_KEEP_ALIVE_MS),
  );
}

/** Da de baja a un cliente SSE: detiene su keep-alive y lo quita del set. No cierra `res`. */
export function eliminarCliente(respuesta: Response): void {
  const idKeepAlive = keepAlives.get(respuesta);
  if (idKeepAlive) {
    clearInterval(idKeepAlive);
    keepAlives.delete(respuesta);
  }
  clientes.delete(respuesta);
}

/** Envía un evento a todos los clientes conectados. Descarta a los que fallen al escribir. */
export function difundir(evento: string, payload: unknown): void {
  const mensaje = `event: ${evento}\ndata: ${JSON.stringify(payload)}\n\n`;

  for (const respuesta of clientes) {
    try {
      respuesta.write(mensaje);
    } catch (error) {
      console.error('[SSE] Error al escribir a un cliente; se elimina:', error);
      eliminarCliente(respuesta);
    }
  }
}
