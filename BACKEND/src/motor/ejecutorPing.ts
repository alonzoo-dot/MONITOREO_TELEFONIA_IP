import { exec } from 'child_process';
import { limitadorPings } from './limitadorPings';

/** IPv4 simple, solo para descartar entradas que no tiene sentido pasarle a ping.exe. */
const REGEX_IPV4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

/**
 * Pinguea una IP con ping.exe (Windows): 1 paquete, con el timeout indicado.
 * Nunca lanza: cualquier fallo (host inalcanzable, timeout, error del exec) es `false`.
 */
export async function ejecutarPing(ip: string, timeoutMs: number = 1000): Promise<boolean> {
  if (!REGEX_IPV4.test(ip)) {
    return false;
  }

  // Pasa por el limitador global para no superar el maximo de pings simultaneos
  return limitadorPings.ejecutar(
    () =>
      new Promise<boolean>((resolve) => {
        exec(`ping.exe -n 1 -w ${timeoutMs} ${ip}`, (error) => {
          resolve(error === null);
        });
      }),
  );
}
