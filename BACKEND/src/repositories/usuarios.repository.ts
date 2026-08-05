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