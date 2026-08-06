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

/** Genera una contraseña temporal aleatoria y legible (letras y números). */
export function generarPasswordTemporal(longitud = 10): string {
  // Sin caracteres confusos (0, O, l, I) para que sea fácil de leer y dictar
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let resultado = '';

  for (let i = 0; i < longitud; i++) {
    const indice = Math.floor(Math.random() * caracteres.length);
    resultado += caracteres[indice];
  }

  return resultado;
}