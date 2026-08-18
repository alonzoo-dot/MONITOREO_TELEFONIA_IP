/**
 * Migración: módulo de Monitoreo (MONITOREO_TELEFONIA_IP)
 * -------------------------------------------------------------------
 * Crea las dos tablas operativas del monitoreo:
 *   monitoreo   -> foto del estado actual, 1:1 con telefonos.
 *   incidencias -> historial de eventos (caidas/recuperaciones), telefonos 1:N.
 *
 * No modifica telefonos ni atas (sus columnas ip ya existen desde Inventario).
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // --- monitoreo: 1:1 con telefonos (id_telefono UNIQUE) ---
  pgm.sql(`
    CREATE TABLE monitoreo (
      id_monitoreo           serial       PRIMARY KEY,
      id_telefono            integer      NOT NULL UNIQUE
                               REFERENCES telefonos (id_telefono) ON DELETE RESTRICT,
      estado                 varchar(20)  NOT NULL DEFAULT 'DESCONOCIDO'
                               CHECK (estado IN ('ONLINE', 'OFFLINE', 'DESCONOCIDO', 'EN_MANTENIMIENTO')),
      fecha_ultima_conexion  timestamptz,
      fecha_ultimo_cambio    timestamptz  NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_monitoreo_estado ON monitoreo (estado);
  `);

  // --- incidencias: historial, telefonos 1-N ---
  pgm.sql(`
    CREATE TABLE incidencias (
      id_incidencia            bigserial    PRIMARY KEY,
      id_telefono              integer      NOT NULL
                                 REFERENCES telefonos (id_telefono) ON DELETE RESTRICT,
      tipo_evento               varchar(15)  NOT NULL
                                 CHECK (tipo_evento IN ('CAIDA', 'RECUPERACION')),
      ip_registrada             inet,                 -- IP congelada al momento del evento
      id_departamento_reporto  integer
                                 REFERENCES departamentos (id_departamento) ON DELETE RESTRICT,
      descripcion_falla         text,
      id_usuario_atendio       integer
                                 REFERENCES usuarios (id_usuario) ON DELETE RESTRICT,
      fecha_atendida            timestamptz,
      fecha_ocurrido            timestamptz  NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_incidencias_id_telefono   ON incidencias (id_telefono);
    CREATE INDEX idx_incidencias_fecha_ocurrido ON incidencias (fecha_ocurrido);
    CREATE INDEX incidencias_pendientes_idx     ON incidencias (id_usuario_atendio)
      WHERE id_usuario_atendio IS NULL;
  `);
};

exports.down = (pgm) => {
  // Orden inverso al de creación para respetar las llaves foráneas.
  pgm.sql(`
    DROP TABLE IF EXISTS incidencias;
    DROP TABLE IF EXISTS monitoreo;
  `);
};
