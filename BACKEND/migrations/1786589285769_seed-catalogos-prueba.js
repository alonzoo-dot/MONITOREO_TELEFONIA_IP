/**
 * Migración de datos semilla (DESACTIVADA).
 *
 * Originalmente poblaba los catálogos (modelos_ata, modelos_telefono,
 * departamentos) con datos de prueba. Se vació para que las instalaciones
 * nuevas arranquen con los catálogos vacíos; el hotel carga sus modelos y
 * departamentos reales desde el módulo de Catálogos.
 *
 * El archivo se conserva (no se borra) para no alterar el historial de
 * migraciones de las bases que ya lo ejecutaron.
 */

exports.shorthands = undefined;

exports.up = () => {
  // Sin datos semilla: los catálogos se cargan desde la aplicación.
};

exports.down = () => {
  // Nada que revertir.
};
