/**
 * Migración: log de auditoría de eliminaciones permanentes (MONITOREO_TELEFONIA_IP)
 * ---------------------------------------------------------------------------------
 * Registra cada eliminación permanente de un dispositivo (borrado físico junto con
 * todo su historial de incidencias y mantenimiento). No tiene FK a `telefonos`: el
 * dispositivo ya no existe cuando se escribe este log, por eso se guarda un snapshot
 * de sus datos originales en columnas de texto. Solo se escribe; no se expone UI de consulta.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE eliminaciones_permanentes (
      id_log                                bigserial    PRIMARY KEY,
      extension_original                    varchar(20)  NOT NULL,
      mac_original                          varchar(17),
      tipo_original                         varchar(15)  NOT NULL
                                               CHECK (tipo_original IN ('IP_ATA', 'IP_NATIVO', 'ANALOGICO')),
      ubicacion_original                    varchar(100) NOT NULL,
      cantidad_incidencias_borradas         integer      NOT NULL DEFAULT 0,
      cantidad_mantenimiento_log_borradas   integer      NOT NULL DEFAULT 0,
      id_usuario                            integer      NOT NULL
                                               REFERENCES usuarios (id_usuario) ON DELETE RESTRICT,
      fecha                                 timestamptz  NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_eliminaciones_permanentes_fecha ON eliminaciones_permanentes (fecha);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS eliminaciones_permanentes;
  `);
};
