import { peticionApi } from './api';
import { obtenerToken } from './sesion';
import type {
  Dispositivo,
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
export function desactivarDispositivo(idTelefono: number): Promise<{ mensaje: string }> {
  return peticionApi<{ mensaje: string }>(`/dispositivos/${idTelefono}`, {
    metodo: 'DELETE',
    token: obtenerToken() ?? undefined,
  });
}

/** Reactiva un dispositivo dado de baja. */
export function reactivarDispositivo(idTelefono: number): Promise<{ mensaje: string }> {
  return peticionApi<{ mensaje: string }>(`/dispositivos/${idTelefono}/reactivar`, {
    metodo: 'POST',
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
