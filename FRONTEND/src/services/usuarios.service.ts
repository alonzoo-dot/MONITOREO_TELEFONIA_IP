import { peticionApi } from './api';
import { obtenerToken } from './sesion';
import type {
  Usuario,
  TipoRol,
  DatosNuevoUsuario,
  DatosEditarUsuario,
  ResultadoPasswordTemporal,
} from '../types/usuario';

/**
 * Mapeo unico entre el nombre de rol (que maneja la UI) y su id_rol numerico
 * (que exige el backend al escribir). Este es el UNICO lugar del frontend que
 * conoce los numeros de rol. Si algun dia se agrega un rol nuevo se toca aqui.
 */
const ID_POR_ROL: Record<TipoRol, number> = {
  ADMINISTRADOR: 1,
  TECNICO: 2,
};

/** Traduce un nombre de rol a su id_rol numerico para enviarlo al backend. */
function idDeRol(rol: TipoRol): number {
  return ID_POR_ROL[rol];
}

/** Obtiene la lista completa de usuarios. */
export function listarUsuarios(): Promise<Usuario[]> {
  return peticionApi<Usuario[]>('/usuarios', {
    token: obtenerToken() ?? undefined,
  });
}

/** Crea un usuario nuevo y devuelve su contrasena temporal generada por el sistema. */
export function crearUsuario(datos: DatosNuevoUsuario): Promise<ResultadoPasswordTemporal> {
  return peticionApi<ResultadoPasswordTemporal>('/usuarios', {
    metodo: 'POST',
    token: obtenerToken() ?? undefined,
    cuerpo: {
      usuario: datos.usuario,
      nombre_completo: datos.nombre_completo,
      id_rol: idDeRol(datos.rol),
    },
  });
}

/** Edita el nombre, rol y estado activo de un usuario existente. */
export function editarUsuario(
  idUsuario: number,
  datos: DatosEditarUsuario,
): Promise<{ mensaje: string }> {
  return peticionApi<{ mensaje: string }>(`/usuarios/${idUsuario}`, {
    metodo: 'PUT',
    token: obtenerToken() ?? undefined,
    cuerpo: {
      nombre_completo: datos.nombre_completo,
      id_rol: idDeRol(datos.rol),
      activo: datos.activo,
    },
  });
}

/** Resetea la contrasena de un usuario y devuelve la nueva temporal. */
export function resetearPassword(idUsuario: number): Promise<ResultadoPasswordTemporal> {
  return peticionApi<ResultadoPasswordTemporal>(`/usuarios/${idUsuario}/reset-password`, {
    metodo: 'POST',
    token: obtenerToken() ?? undefined,
  });
}
