/** Contrato para resolver la IP actual de una MAC (corrección de drift). */
export interface ResolvedorIp {
  /**
   * Devuelve la IP asociada a la MAC dada, o null si no se encuentra.
   * La implementación decide el mecanismo (ARP local, SNMP, DHCP, etc.).
   */
  resolverIp(mac: string): Promise<string | null>;
}
