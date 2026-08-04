import bcrypt from 'bcrypt';

const RONDAS_CIFRADO = 10;

/** Convierte una contraseña en texto plano a un hash seguro para guardar. */
export async function cifrarPassword(passwordPlano: string): Promise<string> {
  return bcrypt.hash(passwordPlano, RONDAS_CIFRADO);
}

/** Verifica si una contraseña en texto plano coincide con un hash guardado. */
export async function verificarPassword(
  passwordPlano: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(passwordPlano, passwordHash);
}