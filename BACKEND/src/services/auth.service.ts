import { buscarPorUsuario, actualizarPassword } from '../repositories/usuarios.repository';
import { verificarPassword, cifrarPassword } from '../utils/password';
import { generarToken } from '../utils/jwt';

/** Error de autenticación con un mensaje seguro para mostrar al usuario. */
export class ErrorAutenticacion extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorAutenticacion';
  }
}

/** Lo que devolvemos cuando un login es exitoso. */
export interface ResultadoLogin {
  token: string;
  debe_cambiar_password: boolean;
  usuario: {
    id_usuario: number;
    usuario: string;
    nombre_completo: string;
    tipo_rol: string;
  };
}

/** Verifica las credenciales y, si son válidas, devuelve un token de sesión. */
export async function iniciarSesion(
  nombreUsuario: string,
  passwordPlano: string,
): Promise<ResultadoLogin> {
  // 1. Buscar el usuario
  const usuario = await buscarPorUsuario(nombreUsuario);
  if (!usuario) {
    throw new ErrorAutenticacion('Usuario o contraseña incorrectos');
  }

  // 2. Verificar la contraseña
  const passwordValido = await verificarPassword(passwordPlano, usuario.password_hash);
  if (!passwordValido) {
    throw new ErrorAutenticacion('Usuario o contraseña incorrectos');
  }

  // 3. Generar el token con los datos del usuario
  const token = generarToken({
    id_usuario: usuario.id_usuario,
    usuario: usuario.usuario,
    tipo_rol: usuario.tipo_rol,
  });

  // 4. Devolver el resultado (incluye si debe cambiar su contraseña)
  return {
    token,
    debe_cambiar_password: usuario.debe_cambiar_password,
    usuario: {
      id_usuario: usuario.id_usuario,
      usuario: usuario.usuario,
      nombre_completo: usuario.nombre_completo,
      tipo_rol: usuario.tipo_rol,
    },
  };
} 

/** Cambia la contraseña de un usuario.
 *  - Cambio obligatorio (primer login): no se pide la contraseña actual.
 *  - Cambio voluntario: se exige la contraseña actual para confirmar identidad.
 */
export async function cambiarPassword(
  idUsuario: number,
  nombreUsuario: string,
  passwordNuevo: string,
  passwordActual?: string,
): Promise<void> {
  // Si es cambio voluntario, verificar la contraseña actual
  if (passwordActual !== undefined) {
    const usuario = await buscarPorUsuario(nombreUsuario);
    if (!usuario) {
      throw new ErrorAutenticacion('Usuario o contraseña incorrectos');
    }

    const actualValido = await verificarPassword(passwordActual, usuario.password_hash);
    if (!actualValido) {
      throw new ErrorAutenticacion('La contraseña actual no es correcta');
    }
  }

  // Cifrar la nueva contraseña y guardarla
  const nuevoHash = await cifrarPassword(passwordNuevo);
  await actualizarPassword(idUsuario, nuevoHash);
}