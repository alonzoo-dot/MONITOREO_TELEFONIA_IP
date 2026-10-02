// Script de emergencia
// La creacion normal del primer administrador se hace desde la interfaz web en /setup
// Este script solo se usa cuando ya existen usuarios y nadie puede entrar como administrador
// Genera una contrasena aleatoria y la imprime en consola

import { poolConexiones } from '../config/database';
import { generarPasswordTemporal, cifrarPassword } from '../utils/password';
import { crearORescatarAdministrador } from '../repositories/usuarios.repository';

async function rescatarAdministrador(): Promise<void> {
  const usuario = process.argv[2] ?? 'admin';

  const passwordTemporal = generarPasswordTemporal();
  const passwordHash = await cifrarPassword(passwordTemporal);

  const creado = await crearORescatarAdministrador(usuario, passwordHash);

  console.log('');
  console.log('========================================');
  console.log(creado ? 'Administrador creado' : 'Administrador rescatado');
  console.log('========================================');
  console.log(`Usuario:     ${usuario}`);
  console.log(`Contraseña:  ${passwordTemporal}`);
  console.log('========================================');
  console.log('Deberás cambiar esta contraseña en el próximo inicio de sesión.');
  console.log('');
}

async function main(): Promise<void> {
  try {
    await rescatarAdministrador();
    await poolConexiones.end();
    process.exit(0);
  } catch (error: unknown) {
    console.error('Error al rescatar el administrador:', error);
    await poolConexiones.end();
    process.exit(1);
  }
}

void main();
