/**
 * Migración de datos semilla (PRUEBA): pobla los catálogos con valores realistas
 * para poder crear dispositivos de prueba vía API.
 *
 * Catálogos sembrados: modelos_ata, modelos_telefono, departamentos.
 * No siembra dispositivos: esos se crean por el endpoint POST /api/dispositivos.
 *
 * Nota: si más adelante se cargan los catálogos reales definitivos, esta
 * migración de prueba puede revertirse con `npm run migrate down`.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Modelos de ATA (Grandstream)
  pgm.sql(`
    INSERT INTO modelos_ata (modelo, marca, cantidad_puertos) VALUES
      ('HT801', 'Grandstream', 1),
      ('HT802', 'Grandstream', 2),
      ('HT814', 'Grandstream', 4);
  `);

  // Modelos de teléfono (IP y analógicos)
  pgm.sql(`
    INSERT INTO modelos_telefono (modelo, marca) VALUES
      ('GRP2601', 'Grandstream'),
      ('GRP2612', 'Grandstream'),
      ('Diamond L2', 'Cetis'),
      ('Ovation OD30', 'Cetis');
  `);

  // Departamentos
  pgm.sql(`
    INSERT INTO departamentos (nombre) VALUES
      ('Recepcion'),
      ('Gerencia'),
      ('Cocina'),
      ('Mantenimiento');
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM departamentos
     WHERE nombre IN ('Recepcion', 'Gerencia', 'Cocina', 'Mantenimiento');
  `);
  pgm.sql(`
    DELETE FROM modelos_telefono
     WHERE modelo IN ('GRP2601', 'GRP2612', 'Diamond L2', 'Ovation OD30');
  `);
  pgm.sql(`
    DELETE FROM modelos_ata
     WHERE modelo IN ('HT801', 'HT802', 'HT814');
  `);
};