/* Migración: crea las tablas roles y usuarios (grupo Seguridad) */

exports.up = (pgm) => {
  // Tabla de roles del sistema
  pgm.createTable('roles', {
    id_rol: 'id',
    tipo_rol: { type: 'varchar(20)', notNull: true, unique: true },
  });

  // Tabla de usuarios (personal del departamento de Sistemas)
  pgm.createTable('usuarios', {
    id_usuario: 'id',
    id_rol: {
      type: 'integer',
      notNull: true,
      references: 'roles(id_rol)',
      onDelete: 'RESTRICT',
    },
    usuario: { type: 'varchar(50)', notNull: true, unique: true },
    nombre_completo: { type: 'varchar(120)', notNull: true },
    password_hash: { type: 'char(60)', notNull: true },
    debe_cambiar_password: { type: 'boolean', notNull: true, default: true },
    activo: { type: 'boolean', notNull: true, default: true },
  });

  // Semilla: los dos roles fijos del sistema
  pgm.sql(`INSERT INTO roles (tipo_rol) VALUES ('ADMINISTRADOR'), ('TECNICO');`);
};

exports.down = (pgm) => {
  pgm.dropTable('usuarios');
  pgm.dropTable('roles');
}; 