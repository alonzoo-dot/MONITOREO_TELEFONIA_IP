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
