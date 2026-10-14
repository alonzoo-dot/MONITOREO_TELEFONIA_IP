import { exec } from 'child_process';
import { promisify } from 'util';
import { ejecutarPing } from './ejecutorPing';
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
  // Barridos activos por prefijo /24, para compartir la promesa entre llamadas concurrentes
  private barridosEnCurso = new Map<string, Promise<void>>();
  // Momento (ms) en que termino el ultimo barrido de cada prefijo /24
  private ultimoBarridoPorSubred = new Map<string, number>();
  private readonly COOLDOWN_BARRIDO_SUBRED_MS = 30 * 60 * 1000;

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

    // Si ya hay un barrido en curso para esta subred, se comparte la misma promesa
    const enCurso = this.barridosEnCurso.get(prefijo);
    if (enCurso) {
      return enCurso;
    }

    // Respeta el cooldown por subred para no saturar la red con barridos repetidos
    const ultimoBarrido = this.ultimoBarridoPorSubred.get(prefijo);
    if (ultimoBarrido !== undefined && Date.now() - ultimoBarrido < this.COOLDOWN_BARRIDO_SUBRED_MS) {
      console.log(`[MOTOR] Barrido en ${prefijo}.0/24 omitido: subred en cooldown.`);
      return;
    }

    const barrido = (async () => {
      console.log(`[MOTOR] Barrido reactivo iniciado en ${prefijo}.0/24...`);

      // Encola los 254 pings con timeout corto (200 ms); el limitador global
      // controla cuantos corren a la vez. ejecutarPing nunca lanza.
      const promesas: Promise<boolean>[] = [];
      for (let i = 1; i <= 254; i++) {
        promesas.push(ejecutarPing(`${prefijo}.${i}`, 200));
      }
      await Promise.all(promesas);

      console.log(`[MOTOR] Barrido reactivo completado en ${prefijo}.0/24.`);
    })().finally(() => {
      this.ultimoBarridoPorSubred.set(prefijo, Date.now());
      this.barridosEnCurso.delete(prefijo);
      // Invalida el cache para que la proxima consulta lea la tabla ARP fresca
      this.cacheExpiraEn = 0;
    });

    this.barridosEnCurso.set(prefijo, barrido);
    return barrido;
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
