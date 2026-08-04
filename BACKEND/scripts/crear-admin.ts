import { ejecutarConsulta, poolConexiones } from '../config/database';
import { cifrarPassword } from '../utils/password';

const USUARIO_ADMIN = 'admin';
const NOMBRE_ADMIN = 'Administrador del Sistema';
const PASSWORD_TEMPORAL = 'Admin123';

async function crearAdministrador(): Promise<void> {
  // 1. Verificar que no exista ya un usuario con ese nombre
  const existente = await ejecutarConsulta(
    'SELECT id_usuario FROM usuarios WHERE usuario = $1',
    [USUARIO_ADMIN],
  );

  if (existente.rows.length > 0) {
    console.log(`El usuario "${USUARIO_ADMIN}" ya existe. No se hace nada.`);
    return;
  }

  // 2. Obtener el id del rol ADMINISTRADOR
  const rol = await ejecutarConsulta<{ id_rol: number }>(
    "SELECT id_rol FROM roles WHERE tipo_rol = 'ADMINISTRADOR'",
  );

  if (rol.rows.length === 0) {
    throw new Error('No existe el rol ADMINISTRADOR. Corre primero las migraciones.');
  }

  const idRolAdmin = rol.rows[0]!.id_rol;

  // 3. Cifrar la contraseña temporal
  const passwordHash = await cifrarPassword(PASSWORD_TEMPORAL);

  // 4. Insertar el usuario administrador
  await ejecutarConsulta(
    `INSERT INTO usuarios (id_rol, usuario, nombre_completo, password_hash, debe_cambiar_password, activo)
     VALUES ($1, $2, $3, $4, true, true)`,
    [idRolAdmin, USUARIO_ADMIN, NOMBRE_ADMIN, passwordHash],
  );

  console.log('Usuario administrador creado correctamente:');
  console.log(`  Usuario:    ${USUARIO_ADMIN}`);
  console.log(`  Contraseña: ${PASSWORD_TEMPORAL}  (deberás cambiarla al entrar)`);
}

crearAdministrador()
  .catch((error: unknown) => {
    console.error('Error al crear el administrador:', error);
  })
  .finally(() => {
    void poolConexiones.end();
  });