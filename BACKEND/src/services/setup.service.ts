import { contarUsuarios, crearPrimerAdministrador } from '../repositories/usuarios.repository';
import { cifrarPassword } from '../utils/password';

/** Codigos de error de negocio de la configuracion inicial. */
export type CodigoErrorSetup = 'YA_CONFIGURADO';

/** Error de negocio de la configuracion inicial. */
export class ErrorSetup extends Error {
  public readonly codigo: CodigoErrorSetup;

  constructor(codigo: CodigoErrorSetup, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorSetup';
    this.codigo = codigo;
  }
}

/** Indica si el sistema todavia no tiene ningun usuario y por lo tanto requiere configuracion. */
export async function requiereConfiguracion(): Promise<boolean> {
  const total = await contarUsuarios();
  return total === 0;
}

/**
 * Crea el primer administrador. Solo funciona si no existe ningun usuario.
 * Una vez creado el primer usuario este flujo queda cerrado de forma permanente
 * y la creacion de cuentas pasa a ser exclusiva del panel de administracion.
 */
export async function registrarPrimerAdministrador(
  usuario: string,
  nombreCompleto: string,
  password: string,
): Promise<number> {
  const pendiente = await requiereConfiguracion();
  if (!pendiente) {
    throw new ErrorSetup(
      'YA_CONFIGURADO',
      'El sistema ya fue configurado. Inicia sesion o pide a un administrador que cree tu cuenta.',
    );
  }

  const passwordHash = await cifrarPassword(password);
  return crearPrimerAdministrador(usuario, nombreCompleto, passwordHash);
}
