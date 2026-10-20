/**
 * Migracion: agrega departamento a telefonos.
 * -----------------------------------------
 * Agrega la columna id_departamento (NULL) a la tabla telefonos, con FK
 * hacia departamentos(id_departamento) ON DELETE RESTRICT.
 *
 * Es NULLABLE porque los telefonos existentes no tienen departamento
 * asignado todavia.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE telefonos
      ADD COLUMN id_departamento integer
        REFERENCES departamentos (id_departamento) ON DELETE RESTRICT;

    CREATE INDEX idx_telefonos_id_departamento ON telefonos (id_departamento);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_telefonos_id_departamento;

    ALTER TABLE telefonos
      DROP COLUMN IF EXISTS id_departamento;
  `);
};
