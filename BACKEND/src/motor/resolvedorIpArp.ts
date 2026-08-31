import { exec } from 'child_process';
import { promisify } from 'util';
import type { ResolvedorIp } from './resolvedorIp';
import { normalizarMac } from './utilidadesMac';

const ejecutarExec = promisify(exec);

/** Cuánto tiempo se reutiliza la última tabla ARP leída antes de volver a invocar `arp -a`. */
const TTL_CACHE_MS = 30_000;

/** Fila de `arp -a`: IP, MAC (con guiones), tipo (dynamic/static). */
const PATRON_FILA_ARP =
  /^\s*(\d{1,3}(?:\.\d{1,3}){3})\s+([0-9a-fA-F]{2}(?:-[0-9a-fA-F]{2}){5})\s+(\w+)/;

interface CacheArp {
  macAIp: Map<string, string>; // MAC normalizada -> IP
  ipAMac: Map<string, string>; // IP -> MAC (formato original, con guiones)
}

/**
 * Resuelve IPs a partir de la tabla ARP local del sistema (`arp -a`, Windows).
 * Cachea la salida por `TTL_CACHE_MS` para no invocar el comando en cada resolución.
 */
export class ResolvedorIpArp implements ResolvedorIp {
  private cache: CacheArp = { macAIp: new Map(), ipAMac: new Map() };
  private cacheExpiraEn = 0;

  async resolverIp(mac: string): Promise<string | null> {
    await this.asegurarCache();
    return this.cache.macAIp.get(normalizarMac(mac)) ?? null;
  }

  async resolverMacDeIp(ip: string): Promise<string | null> {
    await this.asegurarCache();
    return this.cache.ipAMac.get(ip) ?? null;
  }

  async barrerVlan(ipDeRango: string): Promise<void> {
    const octetos = ipDeRango.split('.');
    if (octetos.length !== 4) {
      console.warn(`[MOTOR] barrerVlan: IP inválida ${ipDeRango}, se omite.`);
      return;
    }

    const prefijo = `${octetos[0]}.${octetos[1]}.${octetos[2]}`;
    console.log(`[MOTOR] Barrido reactivo iniciado en ${prefijo}.0/24...`);

    // Lanza los 254 pings en paralelo, timeout corto por ping (200 ms).
    // Windows: -n 1 (un paquete), -w 200 (200 ms). Redirigir stdout a nul.
    const promesas: Promise<unknown>[] = [];
    for (let i = 1; i <= 254; i++) {
      const ip = `${prefijo}.${i}`;
      promesas.push(
        ejecutarExec(`ping -n 1 -w 200 ${ip}`).catch(() => {
          // Ignora errores: los pings que fallan son esperados.
        }),
      );
    }
    await Promise.all(promesas);

    // Invalida el cache para que la próxima consulta lea la tabla ARP fresca.
    this.cacheExpiraEn = 0;

    console.log(`[MOTOR] Barrido reactivo completado en ${prefijo}.0/24.`);
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
      this.cache = { macAIp: new Map(), ipAMac: new Map() };
    } finally {
      this.cacheExpiraEn = Date.now() + TTL_CACHE_MS;
    }
  }

  /** Parsea la salida de `arp -a`, ignorando encabezados y bloques `Interface:`. */
  private parsearArp(salida: string): CacheArp {
    const macAIp = new Map<string, string>();
    const ipAMac = new Map<string, string>();

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

      macAIp.set(macNormalizada, ip);
      ipAMac.set(ip, mac);
    }

    return { macAIp, ipAMac };
  }
}
