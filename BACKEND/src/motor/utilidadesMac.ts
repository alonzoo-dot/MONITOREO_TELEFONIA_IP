/** Normaliza una MAC a mayúsculas sin separadores, para comparar formatos distintos (':' vs '-'). */
export function normalizarMac(mac: string): string {
  return mac.replace(/[:-]/g, '').toUpperCase();
}
