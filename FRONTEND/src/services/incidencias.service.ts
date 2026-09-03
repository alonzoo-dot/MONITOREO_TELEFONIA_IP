import { peticionApi, URL_BASE } from './api';
import { obtenerToken } from './sesion';
import type { Incidencia, RespuestaIncidencias, FiltrosIncidencias } from '../types/incidencia';

// Construye el query string a partir de los filtros. Omite los que no vienen.
function construirQuery(filtros: FiltrosIncidencias): string {
  const params = new URLSearchParams();
  if (filtros.desde) params.set('desde', filtros.desde);
  if (filtros.hasta) params.set('hasta', filtros.hasta);
  if (filtros.tipo) params.set('tipo', filtros.tipo);
  if (filtros.piso !== undefined) params.set('piso', String(filtros.piso));
  if (filtros.busqueda) params.set('busqueda', filtros.busqueda);
  if (filtros.soloPendientes) params.set('soloPendientes', 'true');
  if (filtros.pagina !== undefined) params.set('pagina', String(filtros.pagina));
  if (filtros.tamanoPagina !== undefined) params.set('tamanoPagina', String(filtros.tamanoPagina));
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}

// Lista el historial de incidencias con filtros y paginacion.
export async function listarIncidencias(
  filtros: FiltrosIncidencias = {},
): Promise<RespuestaIncidencias> {
  const query = construirQuery(filtros);
  return peticionApi<RespuestaIncidencias>(`/incidencias${query}`, {
    token: obtenerToken() ?? undefined,
  });
}

// Atiende una caida. La observacion es opcional. Devuelve la incidencia ya atendida.
export async function atenderIncidencia(
  idIncidencia: number,
  descripcionFalla?: string,
): Promise<Incidencia> {
  const cuerpo = descripcionFalla ? { descripcion_falla: descripcionFalla } : {};
  return peticionApi<Incidencia>(`/incidencias/${idIncidencia}/atender`, {
    metodo: 'PATCH',
    cuerpo,
    token: obtenerToken() ?? undefined,
  });
}

// Obtiene el conteo de incidencias pendientes.
export async function obtenerConteoPendientes(): Promise<number> {
  const datos = await peticionApi<{ pendientes: number }>('/incidencias/pendientes/conteo', {
    token: obtenerToken() ?? undefined,
  });
  return datos.pendientes;
}

// Descarga el reporte PDF con los filtros dados y dispara la descarga en el navegador.
// El endpoint devuelve un binario asi que se maneja como blob no como JSON.
export async function descargarReporteIncidencias(
  filtros: FiltrosIncidencias = {},
): Promise<void> {
  const query = construirQuery(filtros);
  const respuesta = await fetch(`${URL_BASE}/incidencias/reporte${query}`, {
    headers: { Authorization: `Bearer ${obtenerToken()}` },
  });
  if (!respuesta.ok) {
    throw new Error('No se pudo generar el reporte');
  }
  const blob = await respuesta.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'reporte-incidencias.pdf';
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
