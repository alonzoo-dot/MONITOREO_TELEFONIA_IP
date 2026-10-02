import { peticionApi, URL_BASE } from './api';
import { obtenerToken } from './sesion';
import type {
  RespuestaTendencia,
  RespuestaResumen,
  RespuestaFotoActual,
  Granularidad,
} from '../types/estadistica';

// Construye el query string agregando solo los filtros con valor
function construirQuery(desde?: string, hasta?: string, granularidad?: Granularidad): string {
  const params = new URLSearchParams();
  if (desde) params.set('desde', desde);
  if (hasta) params.set('hasta', hasta);
  if (granularidad) params.set('granularidad', granularidad);
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}

// Obtiene la serie temporal de caidas para el grafico de tendencia
export async function obtenerTendencia(
  desde: string | undefined,
  hasta: string | undefined,
  granularidad: Granularidad,
): Promise<RespuestaTendencia> {
  const query = construirQuery(desde, hasta, granularidad);
  return peticionApi<RespuestaTendencia>(`/estadisticas/tendencia${query}`, {
    token: obtenerToken() ?? undefined,
  });
}

// Obtiene el resumen con top de dispositivos distribuciones y carga de usuarios
export async function obtenerResumen(desde?: string, hasta?: string): Promise<RespuestaResumen> {
  const query = construirQuery(desde, hasta);
  return peticionApi<RespuestaResumen>(`/estadisticas/resumen${query}`, {
    token: obtenerToken() ?? undefined,
  });
}

// Obtiene la foto actual del estado de la red
export async function obtenerFotoActual(): Promise<RespuestaFotoActual> {
  return peticionApi<RespuestaFotoActual>('/estadisticas/foto-actual', {
    token: obtenerToken() ?? undefined,
  });
}

// Descarga el reporte PDF con el rango dado y dispara la descarga en el navegador.
// El endpoint devuelve un binario asi que se maneja como blob no como JSON.
export async function descargarReporteEstadisticas(desde?: string, hasta?: string): Promise<void> {
  const query = construirQuery(desde, hasta);
  const respuesta = await fetch(`${URL_BASE}/estadisticas/reporte${query}`, {
    headers: { Authorization: `Bearer ${obtenerToken()}` },
  });
  if (!respuesta.ok) {
    throw new Error('No se pudo generar el reporte');
  }
  const blob = await respuesta.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'reporte-estadisticas.pdf';
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
