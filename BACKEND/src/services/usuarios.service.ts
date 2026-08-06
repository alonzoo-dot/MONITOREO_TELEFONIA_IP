import {
  crearUsuario,
  listarUsuarios,
  buscarPorId,
  actualizarUsuario,
  resetearPasswordUsuario,
  existeUsuario,
  type UsuarioPublico,
} from '../repositories/usuarios.repository';
import { cifrarPassword, generarPasswordTemporal } from '../utils/password';

/** Error de negocio en la gestión de usuarios (ej. usuario duplicado). */
export class ErrorUsuarios extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorUsuarios';
  }
}

/** Lo que devolvemos al crear un usuario: sus datos y la contraseña temporal (una sola vez). */
export interface ResultadoNuevoUsuario {
  id_usuario: number;
  usuario: string;
  password_temporal: string;
}

/** Crea un usuario nuevo con una contraseña temporal generada por el sistema. */
export async function registrarUsuario(
  usuario: string,
  nombreCompleto: string,
  idRol: number,
): Promise<ResultadoNuevoUsuario> {
  // Regla: no permitir nombres de usuario duplicados
  const yaExiste = await existeUsuario(usuario);
  if (yaExiste) {
    throw new ErrorUsuarios('Ya existe un usuario con ese nombre');
  }

  // Generar y cifrar la contraseña temporal
  const passwordTemporal = generarPasswordTemporal();
  const passwordHash = await cifrarPassword(passwordTemporal);

  // Crear el usuario en la base
  const idUsuario = await crearUsuario({
    id_rol: idRol,
    usuario,
    nombre_completo: nombreCompleto,
    password_hash: passwordHash,
  });

  // Devolver la temporal SIN cifrar, una sola vez, para que el admin se la dé al técnico
  return { id_usuario: idUsuario, usuario, password_temporal: passwordTemporal };
}

/** Devuelve la lista de todos los usuarios. */
export async function obtenerUsuarios(): Promise<UsuarioPublico[]> {
  return listarUsuarios();
}

/** Edita los datos de un usuario existente (nombre, rol, activo). */
export async function editarUsuario(
  idUsuario: number,
  nombreCompleto: string,
  idRol: number,
  activo: boolean,
): Promise<void> {
  // Verificar que el usuario exista antes de editarlo
  const usuario = await buscarPorId(idUsuario);
  if (!usuario) {
    throw new ErrorUsuarios('El usuario no existe');
  }

  await actualizarUsuario(idUsuario, nombreCompleto, idRol, activo);
}

/** Resetea la contraseña de un usuario: le asigna una nueva temporal. */
export async function resetearPassword(idUsuario: number): Promise<string> {
  // Verificar que el usuario exista
  const usuario = await buscarPorId(idUsuario);
  if (!usuario) {
    throw new ErrorUsuarios('El usuario no existe');
  }

  // Generar y cifrar una nueva contraseña temporal
  const passwordTemporal = generarPasswordTemporal();
  const passwordHash = await cifrarPassword(passwordTemporal);

  // Guardar la nueva temporal (deja debe_cambiar_password en true)
  await resetearPasswordUsuario(idUsuario, passwordHash);

  // Devolver la temporal sin cifrar para que el admin se la dé al usuario
  return passwordTemporal;
}