import { peticionApi, URL_BASE } from './api';
import { obtenerToken } from './sesion';
import type {
  Dispositivo,
  DetalleDispositivo,
  FiltrosDispositivo,
  DatosDispositivo,
  ModeloAta,
  ModeloTelefono,
  Departamento,
} from '../types/inventario';

/** Arma la query string (?tipo=...&piso=...) a partir de los filtros presentes. */
function construirQuery(filtros: FiltrosDispositivo): string {
  const parametros = new URLSearchParams();
  if (filtros.tipo) parametros.set('tipo', filtros.tipo);
  if (filtros.piso !== undefined) parametros.set('piso', String(filtros.piso));
  if (filtros.id_modelo_telefono !== undefined) {
    parametros.set('id_modelo_telefono', String(filtros.id_modelo_telefono));
  }
  if (filtros.activo !== undefined) parametros.set('activo', String(filtros.activo));
  if (filtros.incluir_inactivos) parametros.set('incluir_inactivos', 'true');
  if (filtros.busqueda) parametros.set('busqueda', filtros.busqueda);
  const texto = parametros.toString();
  return texto ? `?${texto}` : '';
}

/** Lista los dispositivos que cumplan los filtros dados. */
export function listarDispositivos(filtros: FiltrosDispositivo = {}): Promise<Dispositivo[]> {
  return peticionApi<Dispositivo[]>(`/dispositivos${construirQuery(filtros)}`, {
    token: obtenerToken() ?? undefined,
  });
}

/** Obtiene el detalle de un dispositivo por su id. */
export function obtenerDispositivo(idTelefono: number): Promise<Dispositivo> {
  return peticionApi<Dispositivo>(`/dispositivos/${idTelefono}`, {
    token: obtenerToken() ?? undefined,
  });
}

/** Obtiene el detalle de solo lectura de un dispositivo, con los derivados de monitoreo. */
export function obtenerDetalle(idTelefono: number): Promise<DetalleDispositivo> {
  return peticionApi<DetalleDispositivo>(`/dispositivos/${idTelefono}/detalle`, {
    token: obtenerToken() ?? undefined,
  });
}

/** Crea un dispositivo nuevo. */
export function crearDispositivo(datos: DatosDispositivo): Promise<Dispositivo> {
  return peticionApi<Dispositivo>('/dispositivos', {
    metodo: 'POST',
    token: obtenerToken() ?? undefined,
    cuerpo: datos,
  });
}

/** Edita un dispositivo existente. */
export function editarDispositivo(
  idTelefono: number,
  datos: DatosDispositivo,
): Promise<Dispositivo> {
  return peticionApi<Dispositivo>(`/dispositivos/${idTelefono}`, {
    metodo: 'PUT',
    token: obtenerToken() ?? undefined,
    cuerpo: datos,
  });
}

/** Da de baja (lógica) un dispositivo. */
export function desactivarDispositivo(idTelefono: number): Promise<void> {
  return peticionApi<void>(`/dispositivos/${idTelefono}/desactivar`, {
    metodo: 'PATCH',
    token: obtenerToken() ?? undefined,
  });
}

/** Reactiva un dispositivo dado de baja. */
export function reactivarDispositivo(idTelefono: number): Promise<void> {
  return peticionApi<void>(`/dispositivos/${idTelefono}/reactivar`, {
    metodo: 'PATCH',
    token: obtenerToken() ?? undefined,
  });
}

/** Elimina permanentemente un dispositivo. Falla si tiene incidencias registradas. */
export function eliminarDispositivo(idTelefono: number): Promise<void> {
  return peticionApi<void>(`/dispositivos/${idTelefono}`, {
    metodo: 'DELETE',
    token: obtenerToken() ?? undefined,
  });
}

/** Lista los modelos de ATA del catálogo. */
export function listarModelosAta(): Promise<ModeloAta[]> {
  return peticionApi<ModeloAta[]>('/catalogos/modelos-ata', {
    token: obtenerToken() ?? undefined,
  });
}

/** Lista los modelos de teléfono del catálogo. */
export function listarModelosTelefono(): Promise<ModeloTelefono[]> {
  return peticionApi<ModeloTelefono[]>('/catalogos/modelos-telefono', {
    token: obtenerToken() ?? undefined,
  });
}

/** Lista los departamentos del catálogo. */
export function listarDepartamentos(): Promise<Departamento[]> {
  return peticionApi<Departamento[]>('/catalogos/departamentos', {
    token: obtenerToken() ?? undefined,
  });
}

/* ===================== Escritura de catálogos ===================== */

/** Crea un modelo de teléfono. */
export function crearModeloTelefono(datos: {
  modelo: string;
  marca: string;
}): Promise<{ id_modelo_telefono: number }> {
  return peticionApi('/catalogos/modelos-telefono', {
    metodo: 'POST',
    token: obtenerToken() ?? undefined,
    cuerpo: datos,
  });
}

/** Edita un modelo de teléfono. */
export function editarModeloTelefono(
  id: number,
  datos: { modelo: string; marca: string },
): Promise<{ mensaje: string }> {
  return peticionApi(`/catalogos/modelos-telefono/${id}`, {
    metodo: 'PUT',
    token: obtenerToken() ?? undefined,
    cuerpo: datos,
  });
}

/** Crea un modelo de ATA. */
export function crearModeloAta(datos: {
  modelo: string;
  marca: string;
  cantidad_puertos: number;
}): Promise<{ id_modelo_ata: number }> {
  return peticionApi('/catalogos/modelos-ata', {
    metodo: 'POST',
    token: obtenerToken() ?? undefined,
    cuerpo: datos,
  });
}

/** Edita un modelo de ATA. */
export function editarModeloAta(
  id: number,
  datos: { modelo: string; marca: string; cantidad_puertos: number },
): Promise<{ mensaje: string }> {
  return peticionApi(`/catalogos/modelos-ata/${id}`, {
    metodo: 'PUT',
    token: obtenerToken() ?? undefined,
    cuerpo: datos,
  });
}

/** Crea un departamento. */
export function crearDepartamento(datos: {
  nombre: string;
}): Promise<{ id_departamento: number }> {
  return peticionApi('/catalogos/departamentos', {
    metodo: 'POST',
    token: obtenerToken() ?? undefined,
    cuerpo: datos,
  });
}

/** Edita un departamento. */
export function editarDepartamento(
  id: number,
  datos: { nombre: string },
): Promise<{ mensaje: string }> {
  return peticionApi(`/catalogos/departamentos/${id}`, {
    metodo: 'PUT',
    token: obtenerToken() ?? undefined,
    cuerpo: datos,
  });
}

/* ===================== Importación ===================== */

/** Descarga la plantilla .xlsx del backend y dispara la descarga en el navegador. */
export async function descargarPlantilla(): Promise<void> {
  const respuesta = await fetch(`${URL_BASE}/dispositivos/plantilla`, {
    headers: { Authorization: `Bearer ${obtenerToken() ?? ''}` },
  });
  if (!respuesta.ok) {
    throw new Error('No se pudo descargar la plantilla');
  }
  const blob = await respuesta.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'plantilla_inventario.xlsx';
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

/** Un error de importación asociado a una fila. */
export interface ErrorFilaImportacion {
  fila: number;
  mensaje: string;
}

/** Reporte devuelto por el endpoint de importación. */
export interface ReporteImportacion {
  total: number;
  creados: number;
  errores: ErrorFilaImportacion[];
}

/** Sube un archivo .xlsx al endpoint de importación y devuelve el reporte. */
export async function importarInventario(archivo: File): Promise<ReporteImportacion> {
  const datos = new FormData();
  datos.append('archivo', archivo);

  const respuesta = await fetch(`${URL_BASE}/dispositivos/importar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${obtenerToken() ?? ''}` },
    body: datos,
  });

  const cuerpo = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(cuerpo?.mensaje ?? 'Error al importar el archivo');
  }
  return cuerpo as ReporteImportacion;
}
