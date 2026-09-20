/**
 * Genera un identificador único para uso interno de la interfaz (ids de toasts,
 * confirmaciones, etc.).
 *
 * Usa `crypto.randomUUID()` cuando está disponible, pero cae a un respaldo cuando
 * NO lo está: `crypto.randomUUID` solo existe en "contexto seguro" (HTTPS o
 * localhost). Al servir el sistema por http://<IP>:4000 en la LAN, el navegador
 * no lo considera seguro y la función no existe, lo que lanzaba
 * "TypeError: crypto.randomUUID is not a function" y rompía los botones.
 */
export function generarId(): string {
  const cripto = globalThis.crypto;
  if (cripto && typeof cripto.randomUUID === 'function') {
    return cripto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
