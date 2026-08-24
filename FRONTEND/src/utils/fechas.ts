/** Duración transcurrida desde una fecha ISO, mostrando solo las 2 unidades más significativas
 *  ("12s", "3m 25s", "2h 14m", "3d 5h"). Null → "—". */
export function formatoRelativo(fechaIso: string | null): string {
  if (!fechaIso) return '—';

  const segundosTotales = Math.max(0, Math.floor((Date.now() - new Date(fechaIso).getTime()) / 1000));

  if (segundosTotales < 60) return `${segundosTotales}s`;

  const minutosTotales = Math.floor(segundosTotales / 60);
  if (minutosTotales < 60) {
    return `${minutosTotales}m ${segundosTotales % 60}s`;
  }

  const horasTotales = Math.floor(minutosTotales / 60);
  if (horasTotales < 24) {
    return `${horasTotales}h ${minutosTotales % 60}m`;
  }

  const dias = Math.floor(horasTotales / 24);
  return `${dias}d ${horasTotales % 24}h`;
}

/** Fecha absoluta en formato local (dd/mm/aaaa hh:mm:ss). Null → "—". */
export function formatoAbsoluto(fechaIso: string | null): string {
  if (!fechaIso) return '—';

  return new Date(fechaIso).toLocaleString('es', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
