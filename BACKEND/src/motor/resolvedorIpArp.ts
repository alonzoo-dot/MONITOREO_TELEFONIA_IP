import { exec } from 'child_process';
import { promisify } from 'util';
import type { ResolvedorIp } from './resolvedorIp';

const ejecutarExec = promisify(exec);

/** Cuánto tiempo se reutiliza la última tabla ARP leída antes de volver a invocar `arp -a`. */
const TTL_CACHE_MS = 30_000;

/** Fila de `arp -a`: IP, MAC (con guiones), tipo (dynamic/static). */
const PATRON_FILA_ARP =
  /^\s*(\d{1,3}(?:\.\d{1,3}){3})\s+([0-9a-fA-F]{2}(?:-[0-9a-fA-F]{2}){5})\s+(\w+)/;

/** Normaliza una MAC a mayúsculas sin separadores, para comparar formatos distintos (':' vs '-'). */
function normalizarMac(mac: string): string {
  return mac.replace(/[:-]/g, '').toUpperCase();
}

/**
 * Resuelve IPs a partir de la tabla ARP local del sistema (`arp -a`, Windows).
 * Cachea la salida por `TTL_CACHE_MS` para no invocar el comando en cada resolución.
 */
export class ResolvedorIpArp implements ResolvedorIp {
  private cache = new Map<string, string>(); // MAC normalizada -> IP
  private cacheExpiraEn = 0;

  async resolverIp(mac: string): Promise<string | null> {
    await this.asegurarCache();
    return this.cache.get(normalizarMac(mac)) ?? null;
  }

  private async asegurarCache(): Promise<void> {
    if (Date.now() < this.cacheExpiraEn) {
      return;
    }

    try {
      const { stdout } = await ejecutarExec('arp -a');
      this.cache = this.parsearArp(stdout);
    } catch (error) {
      console.error('[MOTOR] No se pudo ejecutar "arp -a":', error);
      this.cache = new Map();
    } finally {
      this.cacheExpiraEn = Date.now() + TTL_CACHE_MS;
    }
  }

  /** Parsea la salida de `arp -a`, ignorando encabezados y bloques `Interface:`. */
  private parsearArp(salida: string): Map<string, string> {
    const cache = new Map<string, string>();

    for (const linea of salida.split('\n')) {
      const coincidencia = PATRON_FILA_ARP.exec(linea);
      if (!coincidencia) continue;

      const [, ip, mac, tipo] = coincidencia;
      const macNormalizada = normalizarMac(mac);
      const esBroadcastOMulticast =
        macNormalizada === 'FFFFFFFFFFFF' || macNormalizada.startsWith('01005E');

      // Descarta filas estáticas de broadcast/multicast (no son dispositivos reales).
      if (tipo.toLowerCase() === 'static' && esBroadcastOMulticast) {
        continue;
      }

      cache.set(macNormalizada, ip);
    }

    return cache;
  }
}
