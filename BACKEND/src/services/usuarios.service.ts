import {
  crearUsuario,
  listarUsuarios,
  buscarPorId,
  actualizarUsuario,
  resetearPasswordUsuario,
  existeUsuario,
  contarAdministradoresActivos,
  obtenerRolPorId,
  type UsuarioPublico,
} from '../repositories/usuarios.repository';
import { cifrarPassword, generarPasswordTemporal } from '../utils/password';

/** Codigos de error de negocio de la gestion de usuarios. */
export type CodigoErrorUsuarios =
  | 'NO_ENCONTRADO'
  | 'USUARIO_DUPLICADO'
  | 'ROL_INVALIDO'
  | 'AUTO_DESACTIVACION'
  | 'ULTIMO_ADMIN';

/** Error de negocio en la gestion de usuarios con un codigo para mapear el estado HTTP. */
export class ErrorUsuarios extends Error {
  public readonly codigo: CodigoErrorUsuarios;

  constructor(codigo: CodigoErrorUsuarios, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorUsuarios';
    this.codigo = codigo;
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
    throw new ErrorUsuarios('USUARIO_DUPLICADO', 'Ya existe un usuario con ese nombre');
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
  idUsuarioEjecutor: number,
): Promise<void> {
  // Verificar que el usuario exista antes de editarlo
  const objetivo = await buscarPorId(idUsuario);
  if (!objetivo) {
    throw new ErrorUsuarios('NO_ENCONTRADO', 'El usuario no existe');
  }

  // Verificar que el rol indicado exista para no violar la llave foranea
  const tipoRolNuevo = await obtenerRolPorId(idRol);
  if (!tipoRolNuevo) {
    throw new ErrorUsuarios('ROL_INVALIDO', 'El rol indicado no existe');
  }

  // Regla 1: nadie puede desactivar su propia cuenta
  if (idUsuario === idUsuarioEjecutor && activo === false) {
    throw new ErrorUsuarios('AUTO_DESACTIVACION', 'No puedes desactivar tu propia cuenta');
  }

  // Reglas 2 y 3: el sistema siempre debe conservar al menos un administrador activo
  const eraAdminActivo = objetivo.tipo_rol === 'ADMINISTRADOR' && objetivo.activo === true;
  const seguiraAdminActivo = tipoRolNuevo === 'ADMINISTRADOR' && activo === true;

  if (eraAdminActivo && !seguiraAdminActivo) {
    const adminsActivos = await contarAdministradoresActivos();
    if (adminsActivos <= 1) {
      throw new ErrorUsuarios('ULTIMO_ADMIN', 'No se puede dejar el sistema sin administradores activos');
    }
  }

  await actualizarUsuario(idUsuario, nombreCompleto, idRol, activo);
}

/** Resetea la contraseña de un usuario: le asigna una nueva temporal. */
export async function resetearPassword(idUsuario: number): Promise<string> {
  // Verificar que el usuario exista
  const usuario = await buscarPorId(idUsuario);
  if (!usuario) {
    throw new ErrorUsuarios('NO_ENCONTRADO', 'El usuario no existe');
  }

  // Generar y cifrar una nueva contraseña temporal
  const passwordTemporal = generarPasswordTemporal();
  const passwordHash = await cifrarPassword(passwordTemporal);

  // Guardar la nueva temporal (deja debe_cambiar_password en true)
  await resetearPasswordUsuario(idUsuario, passwordHash);

  // Devolver la temporal sin cifrar para que el admin se la dé al usuario
  return passwordTemporal;
}