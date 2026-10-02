/**
 * Migración: corrige el índice de incidencias pendientes.
 * -----------------------------------------
 * El índice original (incidencias_pendientes_idx) marcaba como "pendiente"
 * cualquier incidencia sin atender (id_usuario_atendio IS NULL), incluyendo las
 * de tipo RECUPERACION, que no se atienden. Este índice lo reemplaza por uno cuyo
 * predicado refleja la definición real de pendiente:
 *     tipo_evento = 'CAIDA' AND id_usuario_atendio IS NULL
 *
 * Solo cambia el índice. No toca tablas, columnas ni datos.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS incidencias_pendientes_idx;

    CREATE INDEX incidencias_pendientes_idx
      ON incidencias (id_usuario_atendio)
      WHERE tipo_evento = 'CAIDA' AND id_usuario_atendio IS NULL;
  `);
};

exports.down = (pgm) => {
  // Revierte a la definición original de la migración de monitoreo.
  pgm.sql(`
    DROP INDEX IF EXISTS incidencias_pendientes_idx;

    CREATE INDEX incidencias_pendientes_idx
      ON incidencias (id_usuario_atendio)
      WHERE id_usuario_atendio IS NULL;
  `);
};
