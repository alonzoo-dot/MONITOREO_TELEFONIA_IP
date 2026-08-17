/**
 * Migración: módulo de Inventario (MONITOREO_TELEFONIA_IP)
 * -------------------------------------------------------------------
 * Crea las seis tablas del inventario:
 *   ubicaciones, modelos_ata, modelos_telefono, departamentos, telefonos, atas.
 *
 * No incluye seeds de catálogos (van en una migración de datos aparte).
 * No crea monitoreo ni incidencias (pertenecen al módulo de monitoreo).
 *
 * Reglas materializadas a nivel de base de datos:
 *   - ubicaciones 1:N telefonos  -> telefonos.id_ubicacion es FK, NO UNIQUE.
 *   - telefonos 1:1 atas         -> atas.id_telefono es UNIQUE.
 *   - Integridad de líneas        -> telefonos.extension es UNIQUE global.
 *   - Borrado lógico             -> campo 'activo' en telefonos y atas.
 *   - FK con ON DELETE RESTRICT  -> nunca se arrastran borrados.
 *
 * Reglas que NO viven aquí (las impone el servicio):
 *   - Unicidad de MAC entre telefonos y atas (la BD no puede cruzar dos tablas).
 *   - Obligatoriedad de MAC según el tipo (IP_ATA / IP_NATIVO la exigen; ANALOGICO no).
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // --- Tablas sin dependencias: catálogos y ubicaciones ---
  pgm.sql(`
    CREATE TABLE ubicaciones (
      id_ubicacion    serial      PRIMARY KEY,
      nombre          varchar(40) NOT NULL UNIQUE,
      piso            smallint    NOT NULL,
      tipo_ubicacion  varchar(15) NOT NULL
                        CHECK (tipo_ubicacion IN ('HABITACION', 'DEPARTAMENTO'))
    );

    CREATE TABLE modelos_ata (
      id_modelo_ata     serial      PRIMARY KEY,
      modelo            varchar(30) NOT NULL UNIQUE,
      marca             varchar(40) NOT NULL,
      cantidad_puertos  integer     NOT NULL
    );

    CREATE TABLE modelos_telefono (
      id_modelo_telefono  serial      PRIMARY KEY,
      modelo              varchar(40) NOT NULL UNIQUE,
      marca               varchar(40) NOT NULL
    );

    CREATE TABLE departamentos (
      id_departamento  serial      PRIMARY KEY,
      nombre           varchar(50) NOT NULL UNIQUE
    );
  `);

  // --- telefonos: depende de ubicaciones y modelos_telefono ---
  pgm.sql(`
    CREATE TABLE telefonos (
      id_telefono         serial      PRIMARY KEY,
      id_ubicacion        integer     NOT NULL
                            REFERENCES ubicaciones (id_ubicacion) ON DELETE RESTRICT,
      id_modelo_telefono  integer     NOT NULL
                            REFERENCES modelos_telefono (id_modelo_telefono) ON DELETE RESTRICT,
      extension           varchar(10) NOT NULL UNIQUE,
      tipo                varchar(15) NOT NULL
                            CHECK (tipo IN ('IP_ATA', 'IP_NATIVO', 'ANALOGICO')),
      numero_serie        varchar(30),
      mac                 macaddr     UNIQUE,   -- solo IP_NATIVO; NULL en IP_ATA y ANALOGICO
      ip                  inet,                 -- la escribe el monitoreo; NULL en este módulo
      activo              boolean     NOT NULL DEFAULT true
    );

    CREATE INDEX idx_telefonos_id_ubicacion       ON telefonos (id_ubicacion);
    CREATE INDEX idx_telefonos_id_modelo_telefono ON telefonos (id_modelo_telefono);
  `);

  // --- atas: depende de telefonos y modelos_ata; UNIQUE en id_telefono => 1:1 ---
  pgm.sql(`
    CREATE TABLE atas (
      id_ata         serial      PRIMARY KEY,
      id_telefono    integer     NOT NULL UNIQUE
                       REFERENCES telefonos (id_telefono) ON DELETE RESTRICT,
      id_modelo_ata  integer     NOT NULL
                       REFERENCES modelos_ata (id_modelo_ata) ON DELETE RESTRICT,
      mac            macaddr     NOT NULL UNIQUE,
      ip             inet,                 -- la escribe el monitoreo; NULL en este módulo
      numero_serie   varchar(30),
      activo         boolean     NOT NULL DEFAULT true
    );

    CREATE INDEX idx_atas_id_modelo_ata ON atas (id_modelo_ata);
  `);
};

exports.down = (pgm) => {
  // Orden inverso al de creación para respetar las llaves foráneas.
  pgm.sql(`
    DROP TABLE IF EXISTS atas;
    DROP TABLE IF EXISTS telefonos;
    DROP TABLE IF EXISTS departamentos;
    DROP TABLE IF EXISTS modelos_telefono;
    DROP TABLE IF EXISTS modelos_ata;
    DROP TABLE IF EXISTS ubicaciones;
  `);
};