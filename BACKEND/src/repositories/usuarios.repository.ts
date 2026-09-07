import { ejecutarConsulta } from '../config/database';

/** La forma de un usuario tal como vive en la base de datos, con el nombre de su rol. */
export interface Usuario {
  id_usuario: number;
  id_rol: number;
  tipo_rol: string;
  usuario: string;
  nombre_completo: string;
  password_hash: string;
  debe_cambiar_password: boolean;
  activo: boolean;
}

/** Busca un usuario activo por su nombre de usuario. Devuelve el usuario o null si no existe. */
export async function buscarPorUsuario(usuario: string): Promise<Usuario | null> {
  const resultado = await ejecutarConsulta<Usuario>(
    `SELECT u.id_usuario, u.id_rol, r.tipo_rol, u.usuario, u.nombre_completo,
            u.password_hash, u.debe_cambiar_password, u.activo
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
      WHERE u.usuario = $1 AND u.activo = true`,
    [usuario],
  );

  return resultado.rows[0] ?? null;
}

/** Actualiza la contraseña de un usuario y desactiva la obligación de cambiarla. */
export async function actualizarPassword(
  idUsuario: number,
  nuevoPasswordHash: string,
): Promise<void> {
  await ejecutarConsulta(
    `UPDATE usuarios
        SET password_hash = $1, debe_cambiar_password = false
      WHERE id_usuario = $2`,
    [nuevoPasswordHash, idUsuario],
  );
}

/** Datos necesarios para crear un usuario nuevo. */
export interface DatosNuevoUsuario {
  id_rol: number;
  usuario: string;
  nombre_completo: string;
  password_hash: string;
}

/** La forma de un usuario para mostrar en listas (sin datos sensibles como el hash). */
export interface UsuarioPublico {
  id_usuario: number;
  usuario: string;
  nombre_completo: string;
  tipo_rol: string;
  activo: boolean;
}

/** Crea un usuario nuevo y devuelve su id generado. */
export async function crearUsuario(datos: DatosNuevoUsuario): Promise<number> {
  const resultado = await ejecutarConsulta<{ id_usuario: number }>(
    `INSERT INTO usuarios (id_rol, usuario, nombre_completo, password_hash, debe_cambiar_password, activo)
     VALUES ($1, $2, $3, $4, true, true)
     RETURNING id_usuario`,
    [datos.id_rol, datos.usuario, datos.nombre_completo, datos.password_hash],
  );
  return resultado.rows[0]!.id_usuario;
}

/** Devuelve todos los usuarios con el nombre de su rol, ordenados por id. */
export async function listarUsuarios(): Promise<UsuarioPublico[]> {
  const resultado = await ejecutarConsulta<UsuarioPublico>(
    `SELECT u.id_usuario, u.usuario, u.nombre_completo, r.tipo_rol, u.activo
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
      ORDER BY u.id_usuario ASC`,
  );
  return resultado.rows;
}

/** Busca un usuario por su id. Devuelve el usuario público o null. */
export async function buscarPorId(idUsuario: number): Promise<UsuarioPublico | null> {
  const resultado = await ejecutarConsulta<UsuarioPublico>(
    `SELECT u.id_usuario, u.usuario, u.nombre_completo, r.tipo_rol, u.activo
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
      WHERE u.id_usuario = $1`,
    [idUsuario],
  );
  return resultado.rows[0] ?? null;
}

/** Actualiza el nombre, rol y estado activo de un usuario. */
export async function actualizarUsuario(
  idUsuario: number,
  nombreCompleto: string,
  idRol: number,
  activo: boolean,
): Promise<void> {
  await ejecutarConsulta(
    `UPDATE usuarios
        SET nombre_completo = $1, id_rol = $2, activo = $3
      WHERE id_usuario = $4`,
    [nombreCompleto, idRol, activo, idUsuario],
  );
}

/** Verifica si ya existe un usuario con ese nombre (para no duplicar). */
export async function existeUsuario(usuario: string): Promise<boolean> {
  const resultado = await ejecutarConsulta<{ existe: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM usuarios WHERE usuario = $1) AS existe',
    [usuario],
  );
  return resultado.rows[0]!.existe;
}

/** Asigna una nueva contraseña y obliga a cambiarla en el próximo login (para reseteos). */
export async function resetearPasswordUsuario(
  idUsuario: number,
  nuevoPasswordHash: string,
): Promise<void> {
  await ejecutarConsulta(
    `UPDATE usuarios
        SET password_hash = $1, debe_cambiar_password = true
      WHERE id_usuario = $2`,
    [nuevoPasswordHash, idUsuario],
  );
}

/** Cuenta cuantos administradores activos existen en el sistema. */
export async function contarAdministradoresActivos(): Promise<number> {
  const resultado = await ejecutarConsulta<{ total: string }>(
    `SELECT COUNT(*) AS total
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
      WHERE r.tipo_rol = 'ADMINISTRADOR' AND u.activo = true`,
  );
  return Number(resultado.rows[0]!.total);
}

/** Devuelve el tipo_rol de un rol por su id o null si no existe. */
export async function obtenerRolPorId(idRol: number): Promise<string | null> {
  const resultado = await ejecutarConsulta<{ tipo_rol: string }>(
    'SELECT tipo_rol FROM roles WHERE id_rol = $1',
    [idRol],
  );
  return resultado.rows[0]?.tipo_rol ?? null;
}