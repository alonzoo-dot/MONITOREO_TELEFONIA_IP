/** Contrato para resolver la IP actual de una MAC (corrección de drift). */
export interface ResolvedorIp {
  /**
   * Devuelve la IP asociada a la MAC dada, o null si no se encuentra.
   * La implementación decide el mecanismo (ARP local, SNMP, DHCP, etc.).
   */
  resolverIp(mac: string): Promise<string | null>;

  /**
   * Devuelve la MAC asociada a una IP dada, o null si no se encuentra.
   * Es la consulta inversa a resolverIp.
   */
  resolverMacDeIp(ip: string): Promise<string | null>;

  /**
   * Barre las IPs de una VLAN pingueándolas todas, para forzar al sistema
   * a poblar su tabla ARP con las MACs correspondientes. Retorna cuando el
   * barrido termina; después, resolverIp/resolverMacDeIp reflejarán las
   * nuevas entradas.
   *
   * @param ipDeRango una IP cualquiera de la VLAN a barrer.
   *                  Ej: `10.81.20.99` → barre `10.81.20.1` a `10.81.20.254`.
   */
  barrerVlan(ipDeRango: string): Promise<void>;
}
