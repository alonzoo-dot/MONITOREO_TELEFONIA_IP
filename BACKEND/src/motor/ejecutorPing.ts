import { exec } from 'child_process';
import { limitadorPings } from './limitadorPings';

/** IPv4 simple, solo para descartar entradas que no tiene sentido pasarle a ping.exe. */
const REGEX_IPV4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

/**
 * Pinguea una IP con ping.exe (Windows): hasta `intentos` pings de 1 paquete, con el
 * timeout indicado. Devuelve true en cuanto uno responde (no lanza los restantes);
 * false solo si fallan todos. Asi una perdida puntual de paquetes no cuenta como caida.
 * Nunca lanza: cualquier fallo (host inalcanzable, timeout, error del exec) cuenta como fallo.
 */
export async function ejecutarPing(
  ip: string,
  timeoutMs: number = 1000,
  intentos: number = 1,
): Promise<boolean> {
  if (!REGEX_IPV4.test(ip)) {
    return false;
  }

  for (let intento = 0; intento < intentos; intento++) {
    // Cada intento pasa por el limitador global para no superar el maximo de pings simultaneos
    const ok = await limitadorPings.ejecutar(
      () =>
        new Promise<boolean>((resolve) => {
          exec(`ping.exe -n 1 -w ${timeoutMs} ${ip}`, (error) => {
            resolve(error === null);
          });
        }),
    );
    if (ok) {
      return true;
    }
  }
  return false;
}
