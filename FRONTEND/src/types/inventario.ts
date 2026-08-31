/** Un dispositivo tal como lo devuelve el backend (vista enriquecida). */
export interface Dispositivo {
  id_telefono: number;
  extension: string;
  tipo: string;
  numero_serie: string | null;
  mac: string | null;
  ip: string | null;
  activo: boolean;
  id_ubicacion: number;
  ubicacion_nombre: string;
  piso: number;
  tipo_ubicacion: string;
  id_modelo_telefono: number;
  modelo_telefono: string;
  marca_telefono: string;
  id_ata: number | null;
  id_modelo_ata: number | null;
  modelo_ata: string | null;
  marca_ata: string | null;
  ata_mac: string | null;
  ata_ip: string | null;
  ata_numero_serie: string | null;
  ata_activo: boolean | null;
  mac_efectiva: string | null;
  ip_efectiva: string | null;
}

/** Filtros para el listado de dispositivos. */
export interface FiltrosDispositivo {
  tipo?: string;
  piso?: number;
  id_modelo_telefono?: number;
  activo?: boolean;
  busqueda?: string;
  /** Si es true, incluye también los dispositivos inactivos. Ignorado si `activo` viene definido. */
  incluir_inactivos?: boolean;
}

/** Datos que se envían al crear o editar un dispositivo. */
export interface DatosDispositivo {
  ubicacion_nombre: string;
  piso: number;
  tipo_ubicacion: string;
  id_modelo_telefono: number;
  extension: string;
  tipo: string;
  numero_serie: string | null;
  mac: string | null;
  ip: string | null;
  id_modelo_ata: number | null;
  ata_numero_serie: string | null;
}

/** Detalle de solo lectura de un dispositivo, con los derivados de monitoreo. */
export interface DetalleDispositivo {
  id_telefono: number;
  ubicacion_nombre: string;
  tipo_ubicacion: string;
  piso: number;
  extension: string;
  tipo: string;
  modelo_telefono: string;
  marca_telefono: string;
  numero_serie: string;
  mac: string | null;
  ip: string | null;
  modelo_ata: string | null;
  marca_ata: string | null;
  cantidad_puertos: number | null;
  ata_numero_serie: string | null;
  activo: boolean;
  estado_monitoreo: 'ONLINE' | 'OFFLINE' | 'DESCONOCIDO' | 'EN_MANTENIMIENTO' | null;
  fecha_ultima_conexion: string | null;
  total_incidencias: number;
  total_mantenimiento_log: number;
}

/** Un modelo de ATA del catálogo. */
export interface ModeloAta {
  id_modelo_ata: number;
  modelo: string;
  marca: string;
  cantidad_puertos: number;
}

/** Un modelo de teléfono del catálogo. */
export interface ModeloTelefono {
  id_modelo_telefono: number;
  modelo: string;
  marca: string;
}

/** Un departamento del catálogo. */
export interface Departamento {
  id_departamento: number;
  nombre: string;
}
