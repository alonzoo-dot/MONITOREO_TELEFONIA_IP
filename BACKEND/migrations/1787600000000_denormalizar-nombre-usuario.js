/**
 * Migración: denormalización de nombre de usuario para eliminación permanente
 * ----------------------------------------------------------------------------
 * Agrega una columna de texto en cada tabla con FK hacia `usuarios` para poder
 * conservar el nombre del usuario en el historial aunque su cuenta se elimine
 * físicamente (hard delete). Antes de borrar el usuario, su nombre_completo se
 * copia a estas columnas y la FK se deja en NULL.
 *
 * Tablas con FK hacia usuarios encontradas en la base:
 *   - incidencias.id_usuario_atendio        (nullable, ON DELETE RESTRICT)
 *   - mantenimiento_log.id_usuario          (NOT NULL,  ON DELETE RESTRICT)
 *   - eliminaciones_permanentes.id_usuario  (NOT NULL,  ON DELETE RESTRICT)
 *
 * Las dos ultimas eran NOT NULL: se relajan a NULL porque al eliminar el
 * usuario su id se pone en NULL en estas filas (preservando el nombre aparte).
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE incidencias
      ADD COLUMN nombre_usuario_atendio text NULL;

    ALTER TABLE mantenimiento_log
      ALTER COLUMN id_usuario DROP NOT NULL,
      ADD COLUMN nombre_usuario text NULL;

    ALTER TABLE eliminaciones_permanentes
      ALTER COLUMN id_usuario DROP NOT NULL,
      ADD COLUMN nombre_usuario text NULL;

    COMMENT ON COLUMN incidencias.nombre_usuario_atendio IS
      'Nombre denormalizado del usuario atendedor. Se popula al eliminar el usuario para preservar auditoria historica.';

    COMMENT ON COLUMN mantenimiento_log.nombre_usuario IS
      'Nombre denormalizado del usuario. Se popula al eliminar el usuario para preservar auditoria historica.';

    COMMENT ON COLUMN eliminaciones_permanentes.nombre_usuario IS
      'Nombre denormalizado del usuario. Se popula al eliminar el usuario para preservar auditoria historica.';
  `);
};

exports.down = (pgm) => {
  // No se restaura el NOT NULL de id_usuario: podria haber filas con id_usuario
  // NULL por eliminaciones permanentes ya ejecutadas, y restaurarlo fallaria.
  pgm.sql(`
    ALTER TABLE eliminaciones_permanentes
      DROP COLUMN IF EXISTS nombre_usuario;

    ALTER TABLE mantenimiento_log
      DROP COLUMN IF EXISTS nombre_usuario;

    ALTER TABLE incidencias
      DROP COLUMN IF EXISTS nombre_usuario_atendio;
  `);
};
