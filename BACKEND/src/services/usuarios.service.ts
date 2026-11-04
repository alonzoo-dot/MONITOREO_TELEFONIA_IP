import {
  crearUsuario,
  listarUsuarios,
  buscarPorId,
  actualizarUsuario,
  resetearPasswordUsuario,
  existeUsuario,
  contarAdministradoresActivos,
  obtenerRolPorId,
  eliminarUsuarioFisico,
  type UsuarioPublico,
} from '../repositories/usuarios.repository';
import { denormalizarUsuarioAtendio } from '../repositories/incidencias.repository';
import { denormalizarUsuario as denormalizarUsuarioMantenimiento } from '../repositories/mantenimiento_log.repository';
import { denormalizarUsuario as denormalizarUsuarioEliminaciones } from '../repositories/eliminaciones_permanentes.repository';
import { ejecutarEnTransaccion } from '../config/database';
import { cifrarPassword, generarPasswordTemporal } from '../utils/password';

/** Codigos de error de negocio de la gestion de usuarios. */
export type CodigoErrorUsuarios =
  | 'NO_ENCONTRADO'
  | 'USUARIO_DUPLICADO'
  | 'ROL_INVALIDO'
  | 'AUTO_DESACTIVACION'
  | 'ULTIMO_ADMIN'
  | 'NO_ELIMINAR_PROPIA_CUENTA'
  | 'ULTIMO_ADMINISTRADOR';

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

/**
 * Elimina un usuario fisicamente (hard delete), permanente e irreversible.
 * A diferencia de editarUsuario (desactivar), esta accion funciona aunque el
 * usuario tenga actividad registrada: antes de borrarlo, su nombre_completo se
 * denormaliza en las tablas que lo referenciaban (incidencias atendidas, log de
 * mantenimiento y log de eliminaciones permanentes) para preservar la auditoria
 * historica, y esos id_usuario quedan en NULL.
 */
export async function eliminarUsuarioPermanentemente(
  idUsuario: number,
  idUsuarioSolicitante: number,
): Promise<void> {
  // Regla: nadie puede eliminar su propia cuenta
  if (idUsuario === idUsuarioSolicitante) {
    throw new ErrorUsuarios(
      'NO_ELIMINAR_PROPIA_CUENTA',
      'No puedes eliminar tu propia cuenta',
    );
  }

  const objetivo = await buscarPorId(idUsuario);
  if (!objetivo) {
    throw new ErrorUsuarios('NO_ENCONTRADO', 'El usuario no existe');
  }

  // Regla: el sistema siempre debe conservar al menos un administrador activo
  const esAdminActivo = objetivo.tipo_rol === 'ADMINISTRADOR' && objetivo.activo === true;
  if (esAdminActivo) {
    const adminsActivos = await contarAdministradoresActivos();
    if (adminsActivos <= 1) {
      throw new ErrorUsuarios(
        'ULTIMO_ADMINISTRADOR',
        'No se puede eliminar al ultimo administrador activo del sistema',
      );
    }
  }

  await ejecutarEnTransaccion(async (cliente) => {
    await denormalizarUsuarioAtendio(idUsuario, objetivo.nombre_completo, cliente);
    await denormalizarUsuarioMantenimiento(idUsuario, objetivo.nombre_completo, cliente);
    await denormalizarUsuarioEliminaciones(idUsuario, objetivo.nombre_completo, cliente);
    await eliminarUsuarioFisico(idUsuario, cliente);
  });

  console.log(
    `[USUARIOS] Usuario '${objetivo.usuario}' eliminado permanentemente por admin ${idUsuarioSolicitante}. Historial preservado con nombre denormalizado.`,
  );
}