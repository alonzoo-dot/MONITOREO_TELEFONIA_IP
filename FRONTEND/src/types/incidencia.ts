// Una fila del historial tal como la devuelve GET /api/incidencias.
export interface Incidencia {
  id_incidencia: number;
  tipo_evento: 'CAIDA' | 'RECUPERACION';
  fecha_ocurrido: string;
  extension: string;
  ubicacion_nombre: string;
  piso: number;
  mac: string | null;
  ip_registrada: string | null;
  id_usuario_atendio: number | null;
  usuario_atendio: string | null;
  fecha_atendida: string | null;
  descripcion_falla: string | null;
  pendiente: boolean;
}

// Respuesta paginada del listado.
export interface RespuestaIncidencias {
  total: number;
  pagina: number;
  tamanoPagina: number;
  incidencias: Incidencia[];
}

// Filtros que acepta el listado. Todos opcionales.
export interface FiltrosIncidencias {
  desde?: string;
  hasta?: string;
  tipo?: 'CAIDA' | 'RECUPERACION';
  piso?: number;
  busqueda?: string;
  soloPendientes?: boolean;
  pagina?: number;
  tamanoPagina?: number;
}
