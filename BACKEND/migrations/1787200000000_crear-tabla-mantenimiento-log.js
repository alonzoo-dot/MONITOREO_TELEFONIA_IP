/**
 * Migración: log de auditoría de mantenimiento (MONITOREO_TELEFONIA_IP)
 * -------------------------------------------------------------------
 * Registra cada vez que un dispositivo entra o sale de EN_MANTENIMIENTO,
 * quién lo hizo y cuándo. Solo se escribe; no se expone UI de consulta.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE mantenimiento_log (
      id_log       bigserial    PRIMARY KEY,
      id_telefono  integer      NOT NULL
                     REFERENCES telefonos (id_telefono) ON DELETE RESTRICT,
      id_usuario   integer      NOT NULL
                     REFERENCES usuarios (id_usuario) ON DELETE RESTRICT,
      accion       varchar(15)  NOT NULL
                     CHECK (accion IN ('ACTIVAR', 'DESACTIVAR')),
      fecha        timestamptz  NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_mantenimiento_log_id_telefono ON mantenimiento_log (id_telefono);
    CREATE INDEX idx_mantenimiento_log_fecha        ON mantenimiento_log (fecha);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS mantenimiento_log;
  `);
};
